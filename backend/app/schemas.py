from pydantic import BaseModel, ConfigDict


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str


class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str


class ItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    category_id: int
    description: str | None = None
    image_url: str | None = None


class OutfitOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    item_ids: list[int]
    items: list[ItemOut]


class UserCreate(BaseModel):
    email: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class CategoryCreate(BaseModel):
    name: str


class ItemCreate(BaseModel):
    name: str
    category_id: int
    description: str | None = None
    image_filename: str | None = None


class ItemUpdate(BaseModel):
    name: str | None = None
    category_id: int | None = None
    description: str | None = None
    image_filename: str | None = None


class OutfitCreate(BaseModel):
    name: str
    item_ids: list[int]
