from fastapi import APIRouter, HTTPException, status

from app.schemas.profiles import Profile, ProfileList, ProfileUpdate
from app.services.profile_service import (
    delete_profile,
    get_profile,
    list_profiles,
    upsert_profile,
)


router = APIRouter()


@router.get("", response_model=ProfileList)
async def read_profiles() -> ProfileList:
    items = await list_profiles()
    return ProfileList(items=items)


@router.get("/{profile_id}", response_model=Profile)
async def read_profile(profile_id: str) -> Profile:
    profile = await get_profile(profile_id)
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return profile


@router.put("/{profile_id}", response_model=Profile, status_code=status.HTTP_201_CREATED)
async def upsert_profile_route(profile_id: str, payload: Profile) -> Profile:
    if payload.id != profile_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Profile id mismatch")
    return await upsert_profile(payload)


@router.patch("/{profile_id}", response_model=Profile)
async def patch_profile(profile_id: str, payload: ProfileUpdate) -> Profile:
    existing = await get_profile(profile_id)
    if existing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    base = existing.model_dump(by_alias=True)
    updates = payload.model_dump(exclude_unset=True, by_alias=True)

    if "preferences" in updates:
        base["preferences"] = {**base["preferences"], **updates["preferences"]}
        updates.pop("preferences")

    base.update(updates)
    merged = Profile.model_validate(base)
    return await upsert_profile(merged)


@router.delete("/{profile_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_profile_route(profile_id: str) -> None:
    await delete_profile(profile_id)


