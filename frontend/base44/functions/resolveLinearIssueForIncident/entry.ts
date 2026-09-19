import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const LINEAR_API = "https://api.linear.app/graphql";

export default async function(req: Request): Promise<Response> {
  try {
    const body = await req.json().catch(() => ({} as any));
    const incidentId = body.incident_id;
    if (!incidentId) {
      return Response.json({ error: "incident_id is required" }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    const incident = await base44.asServiceRole.entities.Incident.get(incidentId);
    if (!incident) {
      return Response.json({ error: "Incident not found" }, { status: 404 });
    }

    const issueId = incident.linear_issue_id;
    if (!issueId) {
      // Nothing to resolve — incident was never linked to a Linear issue.
      return Response.json({ ok: false, reason: "no_linked_linear_issue" });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection("linear");
    if (!accessToken) {
      return Response.json({ error: "Linear connection not available" }, { status: 401 });
    }

    const headers = {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };

    // Fetch the issue to learn its team, so we can pick a "completed" state for that team.
    const issueQuery = `
      query Issue($id: String!) {
        issue(id: $id) {
          id identifier
          team { id name }
          state { id name type }
        }
      }
    `;
    const issueRes = await fetch(LINEAR_API, {
      method: "POST",
      headers,
      body: JSON.stringify({ query: issueQuery, variables: { id: issueId } }),
    });
    const issueJson: any = await issueRes.json();
    if (issueJson.errors) {
      return Response.json({ error: "Linear issue query failed", details: issueJson.errors }, { status: 502 });
    }
    const issue = issueJson.data?.issue;
    if (!issue) {
      return Response.json({ ok: false, reason: "linear_issue_not_found" });
    }

    // Already in a completed state — nothing to do.
    if (issue.state?.type === "completed") {
      return Response.json({ ok: true, already_resolved: true, state: issue.state.name });
    }

    const teamId = issue.team?.id;
    if (!teamId) {
      return Response.json({ error: "Issue team not available" }, { status: 502 });
    }

    // Find a workflow state of type "completed" for the team (e.g. "Done"/"Resolved").
    const statesQuery = `
      query TeamStates($id: String!) {
        team(id: $id) {
          states { nodes { id name type } }
        }
      }
    `;
    const statesRes = await fetch(LINEAR_API, {
      method: "POST",
      headers,
      body: JSON.stringify({ query: statesQuery, variables: { id: teamId } }),
    });
    const statesJson: any = await statesRes.json();
    if (statesJson.errors) {
      return Response.json({ error: "Linear states query failed", details: statesJson.errors }, { status: 502 });
    }
    const states = statesJson.data?.team?.states?.nodes ?? [];
    const completed = states.find((s: any) => s.type === "completed") || states.find((s: any) => /done|resolved|complete/i.test(s.name));
    if (!completed) {
      return Response.json({ error: "No completed state found for team" }, { status: 502 });
    }

    const updateMutation = `
      mutation UpdateIssue($id: String!, $input: IssueUpdateInput!) {
        issueUpdate(id: $id, input: $input) {
          success
          issue { id identifier state { id name type } }
        }
      }
    `;
    const updateRes = await fetch(LINEAR_API, {
      method: "POST",
      headers,
      body: JSON.stringify({
        query: updateMutation,
        variables: { id: issueId, input: { stateId: completed.id } },
      }),
    });
    const updateJson: any = await updateRes.json();
    if (updateJson.errors) {
      return Response.json({ error: "Linear issueUpdate failed", details: updateJson.errors }, { status: 502 });
    }

    return Response.json({
      ok: true,
      linear_issue: updateJson.data?.issueUpdate?.issue,
      state: completed.name,
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}