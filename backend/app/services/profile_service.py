from __future__ import annotations

from typing import List, Optional

from sqlalchemy import JSON, String, Text, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from app.core.config import settings
from app.schemas.profiles import Profile


class Base(DeclarativeBase):
    pass


class ProfileModel(Base):
    __tablename__ = "profiles"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    label: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    preferences: Mapped[dict] = mapped_column(JSON)
    generative_hints: Mapped[dict] = mapped_column("generativeHints", JSON)


engine = create_async_engine(settings.database_url, echo=False)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def list_profiles(session: Optional[AsyncSession] = None) -> List[Profile]:
    owns_session = session is None
    session = session or SessionLocal()
    try:
        result = await session.execute(select(ProfileModel))
        profiles = []
        for row in result.scalars():
            profiles.append(
                Profile.model_validate(
                    {
                        "id": row.id,
                        "label": row.label,
                        "description": row.description,
                        "preferences": row.preferences,
                        "generativeHints": row.generative_hints,
                    }
                )
            )
        return profiles
    finally:
        if owns_session:
            await session.close()


async def get_profile(profile_id: str, session: Optional[AsyncSession] = None) -> Optional[Profile]:
    owns_session = session is None
    session = session or SessionLocal()
    try:
        row = await session.get(ProfileModel, profile_id)
        if row is None:
            return None
        return Profile.model_validate(
            {
                "id": row.id,
                "label": row.label,
                "description": row.description,
                "preferences": row.preferences,
                "generativeHints": row.generative_hints,
            }
        )
    finally:
        if owns_session:
            await session.close()


async def upsert_profile(profile: Profile, session: Optional[AsyncSession] = None) -> Profile:
    owns_session = session is None
    session = session or SessionLocal()
    try:
        existing = await session.get(ProfileModel, profile.id)
        if existing:
            existing.label = profile.label
            existing.description = profile.description
            existing.preferences = profile.preferences.model_dump(by_alias=True)
            existing.generative_hints = profile.generativeHints
        else:
            session.add(
                ProfileModel(
                    id=profile.id,
                    label=profile.label,
                    description=profile.description,
                    preferences=profile.preferences.model_dump(by_alias=True),
                    generative_hints=profile.generativeHints,
                )
            )
        await session.commit()
        return profile
    finally:
        if owns_session:
            await session.close()


async def delete_profile(profile_id: str, session: Optional[AsyncSession] = None) -> None:
    owns_session = session is None
    session = session or SessionLocal()
    try:
        existing = await session.get(ProfileModel, profile_id)
        if existing:
            await session.delete(existing)
            await session.commit()
    finally:
        if owns_session:
            await session.close()

