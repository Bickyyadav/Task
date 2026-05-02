import asyncio
import os
from dotenv import load_dotenv
from app.models.user import User
from app.core.config import settings
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

async def run():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    await init_beanie(
        database=client[settings.MONGODB_DB_NAME],
        document_models=[User]
    )
    users = await User.find_all().to_list()
    print(f"Total users: {len(users)}")
    for u in users:
        print(f"- {u.full_name} ({u.email}) [Role: {u.role}, UID: {u.uid}]")

if __name__ == "__main__":
    asyncio.run(run())
