import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const LINEAR_API = "https://api.linear.app/graphql";

// Mapa de severidade da Central -> prioridade do Linear (0=urgente ... 4=nenhuma)
const PRIORITY_MAP: Record<string, number> = {
  low: 3,
  medium: 2,
  high: 1,
  critical: 0,
};

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

    const { accessToken } = await base44.asServiceRole.connectors.getConnection("linear");
    if (!accessToken) {
      return Response.json({ error: "Linear connection not available" }, { status: 401 });
    }

    const headers = {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };

    // Descobre o primeiro time disponível para onde criar a issue
    const teamsRes = await fetch(LINEAR_API, {
      method: "POST",
      headers,
      body: JSON.stringify({ query: "query { teams { nodes { id name key } } }" }),
    });
    const teamsJson: any = await teamsRes.json();
    if (teamsJson.errors) {
      return Response.json({ error: "Linear teams query failed", details: teamsJson.errors }, { status: 502 });
    }
    const teams = teamsJson.data?.teams?.nodes ?? [];
    if (!teams.length) {
      return Response.json({ error: "No Linear teams available" }, { status: 404 });
    }
    const team = teams[0];

    const title = `[Incidente] ${incident.title}`;
    const description = [
      `**SaaS:** ${incident.saas || "—"}`,
      `**Severidade:** ${incident.severity || "medium"}`,
      `**Status:** ${incident.status || "open"}`,
      "",
      incident.description || "",
      "",
      `Aberto na Central SaaS Hub em ${incident.opened_at || new Date().toISOString()}`,
    ].join("\n");

    const priority = PRIORITY_MAP[incident.severity] ?? 2;

    const createMutation = `
      mutation CreateIssue($input: IssueCreateInput!) {
        issueCreate(input: $input) {
          success
          issue { id identifier url title }
        }
      }
    `;
    const createRes = await fetch(LINEAR_API, {
      method: "POST",
      headers,
      body: JSON.stringify({
        query: createMutation,
        variables: {
          input: {
            title,
            description,
            teamId: team.id,
            priority,
          },
        },
      }),
    });
    const createJson: any = await createRes.json();
    if (createJson.errors) {
      return Response.json({ error: "Linear issueCreate failed", details: createJson.errors }, { status: 502 });
    }
    const issue = createJson.data?.issueCreate?.issue;

    // Persiste o vínculo no incidente para que o fluxo de resolução possa atualizá-lo depois.
    if (issue?.id) {
      try {
        await base44.asServiceRole.entities.Incident.update(incidentId, {
          linear_issue_id: issue.id,
        });
      } catch {}
    }

    return Response.json({
      ok: true,
      linear_issue: issue,
      team: { id: team.id, name: team.name },
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}