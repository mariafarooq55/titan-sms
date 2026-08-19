from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.deps import get_current_user
from app.models.setup import Country, City, Campus, Course
from app.models.user import Role, User


router = APIRouter(
    prefix="/api/setup",
    tags=["setup"],
)


# ============================================================
# ADMIN ACCESS
# ============================================================

async def require_admin(
    user: User = Depends(get_current_user),
):
    if user.role not in [Role.SUPER_ADMIN, Role.SUB_ADMIN]:
        raise HTTPException(
            status_code=403,
            detail="Admin access required",
        )

    return user


# ============================================================
# REQUEST MODELS
# ============================================================

class NameRequest(BaseModel):
    name: str


class CityRequest(BaseModel):
    name: str
    country_id: str


class CampusRequest(BaseModel):
    name: str
    city_id: str


# ============================================================
# COUNTRIES
# ============================================================

@router.get("/countries")
async def get_countries(
    user: User = Depends(require_admin),
):
    countries = await Country.find_all().to_list()

    return {
        "items": [
            {
                "id": str(country.id),
                "name": country.name,
            }
            for country in countries
        ]
    }


@router.post("/countries")
async def create_country(
    payload: NameRequest,
    user: User = Depends(require_admin),
):
    name = payload.name.strip()

    if not name:
        raise HTTPException(
            status_code=400,
            detail="Country name is required",
        )

    existing = await Country.find_one(
        Country.name == name
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Country already exists",
        )

    country = Country(name=name)

    await country.insert()

    return {
        "message": "Country added successfully",
        "item": {
            "id": str(country.id),
            "name": country.name,
        },
    }


@router.put("/countries/{country_id}")
async def update_country(
    country_id: str,
    payload: NameRequest,
    user: User = Depends(require_admin),
):
    name = payload.name.strip()

    if not name:
        raise HTTPException(
            status_code=400,
            detail="Country name is required",
        )

    country = await Country.get(country_id)

    if not country:
        raise HTTPException(
            status_code=404,
            detail="Country not found",
        )

    existing = await Country.find_one(
        Country.name == name
    )

    if existing and str(existing.id) != country_id:
        raise HTTPException(
            status_code=400,
            detail="Country already exists",
        )

    country.name = name

    await country.save()

    return {
        "message": "Country updated successfully",
        "item": {
            "id": str(country.id),
            "name": country.name,
        },
    }


@router.delete("/countries/{country_id}")
async def delete_country(
    country_id: str,
    user: User = Depends(require_admin),
):
    country = await Country.get(country_id)

    if not country:
        raise HTTPException(
            status_code=404,
            detail="Country not found",
        )

    cities = await City.find(
        City.country_id == country_id
    ).to_list()

    if cities:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete country because cities are linked to it",
        )

    await country.delete()

    return {
        "message": "Country deleted successfully"
    }


# ============================================================
# CITIES
# ============================================================

@router.get("/cities")
async def get_cities(
    country_id: str | None = None,
    user: User = Depends(require_admin),
):
    if country_id:
        cities = await City.find(
            City.country_id == country_id
        ).to_list()
    else:
        cities = await City.find_all().to_list()

    return {
        "items": [
            {
                "id": str(city.id),
                "name": city.name,
                "country_id": city.country_id,
            }
            for city in cities
        ]
    }


@router.post("/cities")
async def create_city(
    payload: CityRequest,
    user: User = Depends(require_admin),
):
    name = payload.name.strip()

    if not name:
        raise HTTPException(
            status_code=400,
            detail="City name is required",
        )

    country = await Country.get(payload.country_id)

    if not country:
        raise HTTPException(
            status_code=404,
            detail="Country not found",
        )

    existing = await City.find_one(
        City.name == name,
        City.country_id == payload.country_id,
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="City already exists in this country",
        )

    city = City(
        name=name,
        country_id=payload.country_id,
    )

    await city.insert()

    return {
        "message": "City added successfully",
        "item": {
            "id": str(city.id),
            "name": city.name,
            "country_id": city.country_id,
        },
    }


@router.put("/cities/{city_id}")
async def update_city(
    city_id: str,
    payload: CityRequest,
    user: User = Depends(require_admin),
):
    name = payload.name.strip()

    if not name:
        raise HTTPException(
            status_code=400,
            detail="City name is required",
        )

    city = await City.get(city_id)

    if not city:
        raise HTTPException(
            status_code=404,
            detail="City not found",
        )

    country = await Country.get(payload.country_id)

    if not country:
        raise HTTPException(
            status_code=404,
            detail="Country not found",
        )

    existing = await City.find_one(
        City.name == name,
        City.country_id == payload.country_id,
    )

    if existing and str(existing.id) != city_id:
        raise HTTPException(
            status_code=400,
            detail="City already exists in this country",
        )

    city.name = name
    city.country_id = payload.country_id

    await city.save()

    return {
        "message": "City updated successfully",
        "item": {
            "id": str(city.id),
            "name": city.name,
            "country_id": city.country_id,
        },
    }


@router.delete("/cities/{city_id}")
async def delete_city(
    city_id: str,
    user: User = Depends(require_admin),
):
    city = await City.get(city_id)

    if not city:
        raise HTTPException(
            status_code=404,
            detail="City not found",
        )

    campuses = await Campus.find(
        Campus.city_id == city_id
    ).to_list()

    if campuses:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete city because campuses are linked to it",
        )

    await city.delete()

    return {
        "message": "City deleted successfully"
    }


# ============================================================
# CAMPUSES
# ============================================================

@router.get("/campuses")
async def get_campuses(
    city_id: str | None = None,
    user: User = Depends(require_admin),
):
    if city_id:
        campuses = await Campus.find(
            Campus.city_id == city_id
        ).to_list()
    else:
        campuses = await Campus.find_all().to_list()

    return {
        "items": [
            {
                "id": str(campus.id),
                "name": campus.name,
                "city_id": campus.city_id,
            }
            for campus in campuses
        ]
    }


@router.post("/campuses")
async def create_campus(
    payload: CampusRequest,
    user: User = Depends(require_admin),
):
    name = payload.name.strip()

    if not name:
        raise HTTPException(
            status_code=400,
            detail="Campus name is required",
        )

    city = await City.get(payload.city_id)

    if not city:
        raise HTTPException(
            status_code=404,
            detail="City not found",
        )

    existing = await Campus.find_one(
        Campus.name == name,
        Campus.city_id == payload.city_id,
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Campus already exists in this city",
        )

    campus = Campus(
        name=name,
        city_id=payload.city_id,
    )

    await campus.insert()

    return {
        "message": "Campus added successfully",
        "item": {
            "id": str(campus.id),
            "name": campus.name,
            "city_id": campus.city_id,
        },
    }


@router.put("/campuses/{campus_id}")
async def update_campus(
    campus_id: str,
    payload: CampusRequest,
    user: User = Depends(require_admin),
):
    name = payload.name.strip()

    if not name:
        raise HTTPException(
            status_code=400,
            detail="Campus name is required",
        )

    campus = await Campus.get(campus_id)

    if not campus:
        raise HTTPException(
            status_code=404,
            detail="Campus not found",
        )

    city = await City.get(payload.city_id)

    if not city:
        raise HTTPException(
            status_code=404,
            detail="City not found",
        )

    existing = await Campus.find_one(
        Campus.name == name,
        Campus.city_id == payload.city_id,
    )

    if existing and str(existing.id) != campus_id:
        raise HTTPException(
            status_code=400,
            detail="Campus already exists in this city",
        )

    campus.name = name
    campus.city_id = payload.city_id

    await campus.save()

    return {
        "message": "Campus updated successfully",
        "item": {
            "id": str(campus.id),
            "name": campus.name,
            "city_id": campus.city_id,
        },
    }


@router.delete("/campuses/{campus_id}")
async def delete_campus(
    campus_id: str,
    user: User = Depends(require_admin),
):
    campus = await Campus.get(campus_id)

    if not campus:
        raise HTTPException(
            status_code=404,
            detail="Campus not found",
        )

    await campus.delete()

    return {
        "message": "Campus deleted successfully"
    }


# ============================================================
# COURSES
# ============================================================

@router.get("/courses")
async def get_courses(
    user: User = Depends(require_admin),
):
    courses = await Course.find_all().to_list()

    return {
        "items": [
            {
                "id": str(course.id),
                "name": course.name,
            }
            for course in courses
        ]
    }


@router.post("/courses")
async def create_course(
    payload: NameRequest,
    user: User = Depends(require_admin),
):
    name = payload.name.strip()

    if not name:
        raise HTTPException(
            status_code=400,
            detail="Course name is required",
        )

    existing = await Course.find_one(
        Course.name == name
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Course already exists",
        )

    course = Course(
        name=name,
    )

    await course.insert()

    return {
        "message": "Course added successfully",
        "item": {
            "id": str(course.id),
            "name": course.name,
        },
    }


@router.put("/courses/{course_id}")
async def update_course(
    course_id: str,
    payload: NameRequest,
    user: User = Depends(require_admin),
):
    name = payload.name.strip()

    if not name:
        raise HTTPException(
            status_code=400,
            detail="Course name is required",
        )

    course = await Course.get(course_id)

    if not course:
        raise HTTPException(
            status_code=404,
            detail="Course not found",
        )

    existing = await Course.find_one(
        Course.name == name
    )

    if existing and str(existing.id) != course_id:
        raise HTTPException(
            status_code=400,
            detail="Course already exists",
        )

    course.name = name

    await course.save()

    return {
        "message": "Course updated successfully",
        "item": {
            "id": str(course.id),
            "name": course.name,
        },
    }


@router.delete("/courses/{course_id}")
async def delete_course(
    course_id: str,
    user: User = Depends(require_admin),
):
    course = await Course.get(course_id)

    if not course:
        raise HTTPException(
            status_code=404,
            detail="Course not found",
        )

    await course.delete()

    return {
        "message": "Course deleted successfully"
    }