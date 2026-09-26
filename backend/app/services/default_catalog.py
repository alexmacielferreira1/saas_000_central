from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.saas import SaasProduct

DEFAULT_PRODUCTS = [
    {
        "name": "ClinicaFit",
        "slug": "clinicafit",
        "description": "Clínica e fitness: agendamentos, prontuário e planos.",
        "color": "#f43f5e",
    },
    {
        "name": "Núcleo Clínico",
        "slug": "nucleo-clinico",
        "description": "Prontuário, agendas e gestão clínica multi-tenant.",
        "color": "#0ea5e9",
    },
    {
        "name": "SaaS Cleaning USA",
        "slug": "saas-cleaning-usa",
        "description": "Agendamento e gestão de serviços de limpeza (EUA).",
        "color": "#14b8a6",
    },
    {
        "name": "RH Completo",
        "slug": "rh-completo",
        "description": "Folha, ponto, recrutamento e gestão de pessoas — versão consolidada.",
        "color": "#10b981",
    },
    {
        "name": "RS Seguro",
        "slug": "rs-seguro",
        "description": "Cotação, apólices e gestão de seguros.",
        "color": "#3b82f6",
    },
    {
        "name": "Viaje Mais",
        "slug": "viaje-mais",
        "description": "Reservas, pacotes e gestão de viagens.",
        "color": "#8b5cf6",
    },
    {
        "name": "Medicina",
        "slug": "medicina",
        "description": "Prontuário e agendamento clínico.",
        "color": "#0ea5e9",
        "version": "3.1.2",
        "base_url": "https://api.medicina.app",
        "status": "limited",
        "health": "healthy",
        "compatibility": "limited",
        "integration_level": "read",
        "tenant_count": 8,
        "user_count": 56,
        "admin_api_version": "1",
    },
    {
        "name": "MediaMind AI",
        "slug": "mediamind-ai",
        "description": "Mídia e analytics com IA para campanhas.",
        "color": "#8b5cf6",
        "version": "1.8.0",
        "base_url": "https://mediamindai-backend.onrender.com",
        "status": "connected",
        "health": "degraded",
        "compatibility": "supported",
        "integration_level": "users_config",
        "tenant_count": 5,
        "user_count": 34,
        "admin_api_version": "1",
    },
    {
        "name": "RH2",
        "slug": "rh2",
        "description": "Recrutamento e onboarding de talentos.",
        "color": "#ec4899",
        "version": "1.2.0",
        "compatibility": "incompatible",
        "admin_api_version": "0",
    },
    {
        "name": "LojaFácil360",
        "slug": "lojafacil360",
        "description": "Plataforma de varejo e gestão de lojas multi-tenant.",
        "color": "#f59e0b",
        "version": "2.4.1",
        "base_url": "https://api.lojafacil360.app",
        "status": "connected",
        "health": "healthy",
        "compatibility": "supported",
        "integration_level": "write_controlled",
        "tenant_count": 12,
        "user_count": 87,
        "admin_api_version": "1",
    },
    {
        "name": "RH",
        "slug": "rh",
        "description": "Folha, ponto e gestão de pessoas.",
        "color": "#10b981",
        "version": "2.0.7",
        "base_url": "https://api.rh.app",
        "status": "connected",
        "health": "healthy",
        "compatibility": "supported",
        "integration_level": "domain_resources",
        "tenant_count": 6,
        "user_count": 42,
        "admin_api_version": "1",
    },
]


def seed_default_catalog(session: Session, tenant_id: str) -> None:
    existing = set(
        session.scalars(select(SaasProduct.slug).where(SaasProduct.tenant_id == tenant_id))
    )
    for product in DEFAULT_PRODUCTS:
        if product["slug"] not in existing:
            session.add(SaasProduct(tenant_id=tenant_id, **product))
    session.commit()
