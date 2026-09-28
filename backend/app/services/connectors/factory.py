from app.services.connectors.mediamind import MediaMindConnector


def connector_for(product_slug: str, base_url: str, token: str):
    if product_slug == "mediamind-ai":
        return MediaMindConnector(base_url, token)
    return MediaMindConnector(base_url, token)
