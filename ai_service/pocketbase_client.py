import os
import httpx
from typing import List, Dict, Any, Optional

class PocketBaseClient:
    def __init__(self) -> None:
        self.base_url: str = os.getenv("POCKETBASE_URL", "http://127.0.0.1:8090")
        self.admin_email: Optional[str] = os.getenv("POCKETBASE_ADMIN_EMAIL")
        self.admin_password: Optional[str] = os.getenv("POCKETBASE_ADMIN_PASSWORD")
        self.token: Optional[str] = None
        # Use AsyncClient for performance
        self.client: httpx.AsyncClient = httpx.AsyncClient(base_url=self.base_url, timeout=5.0)

    async def authenticate(self) -> None:
        """Authenticates as admin to get a bearer token."""
        if not self.admin_email or not self.admin_password:
            print("Warning: POCKETBASE_ADMIN_EMAIL or POCKETBASE_ADMIN_PASSWORD not set. Data access will be limited.")
            return

        try:
            print(f"Authenticating with PocketBase at {self.base_url} as {self.admin_email}...")
            # Try the legacy admin endpoint first
            endpoint = "/api/admins/auth-with-password"
            response = await self.client.post(endpoint, json={
                "identity": self.admin_email,
                "password": self.admin_password
            })
            
            # If 404, try the new v0.23+ superuser endpoint
            if response.status_code == 404:
                print(f"Endpoint {endpoint} not found (404). Trying /api/collections/_superusers/auth-with-password...")
                endpoint = "/api/collections/_superusers/auth-with-password"
                response = await self.client.post(endpoint, json={
                    "identity": self.admin_email,
                    "password": self.admin_password
                })

            if response.status_code == 200:
                data = response.json()
                self.token = data["token"]
                self.client.headers["Authorization"] = f"Bearer {self.token}"
                print("Successfully authenticated with PocketBase.")
            else:
                print(f"Failed to authenticate with PocketBase: {response.status_code} {response.text}")
        except Exception as e:
            print(f"Connection error during PocketBase auth: {e}")

    async def get_collections(self) -> List[str]:
        """Returns a list of available collection names."""
        try:
            response = await self.client.get("/api/collections?perPage=100")
            if response.status_code == 200:
                data = response.json()
                items: List[Dict[str, Any]] = data.get("items", [])
                return [item["name"] for item in items]
            return []
        except Exception:
            return []

    async def get_knowledge_docs(self) -> List[Dict[str, Any]]:
        """Fetches all records from knowledge_docs collection."""
        try:
            response = await self.client.get("/api/collections/knowledge_docs/records?sort=-created")
            if response.status_code == 200:
                return response.json().get("items", [])
            return []
        except Exception as e:
            print(f"Error fetching knowledge docs: {e}")
            return []

    async def download_file(self, collection_id: str, record_id: str, filename: str, dest_path: str) -> bool:
        """Downloads a file from PocketBase to local destination."""
        try:
            url = f"/api/files/{collection_id}/{record_id}/{filename}"
            response = await self.client.get(url)
            if response.status_code == 200:
                with open(dest_path, "wb") as f:
                    f.write(response.content)
                return True
            print(f"Failed to download {filename}: {response.status_code}")
            return False
        except Exception as e:
            print(f"Error downloading file {filename}: {e}")
            return False


    async def search_collection(self, collection: str, filter_str: str = "", limit: int = 5) -> List[Dict[str, Any]]:
        """Searches a specific collection."""
        try:
            params: Dict[str, Any] = {"perPage": limit, "sort": "-created"}
            if filter_str:
                params["filter"] = filter_str
            
            response = await self.client.get(f"/api/collections/{collection}/records", params=params)
            if response.status_code == 200:
                data = response.json()
                return data.get("items", [])
            return []
        except Exception as e:
            print(f"Error searching collection {collection}: {e}")
            return []

    async def get_user_count(self) -> int:
        try:
            response = await self.client.get("/api/collections/users/records?perPage=1&page=1")
            if response.status_code == 200:
                data = response.json()
                return data.get("totalItems", 0)
            return 0
        except:
            return 0

    async def get_recent_activity(self) -> str:
        """
        Aggregates recent activity across key collections to give the AI a 'pulse' of the system.
        """
        activity_summary: List[str] = []
        
        try:
            # Check Users
            new_users = await self.search_collection("users", limit=3)
            if new_users:
                names = [u.get("name", "Unknown") for u in new_users]
                activity_summary.append(f"Recent Users: {', '.join(names)}")
                
            # Check Products (if MarketApp)
            products = await self.search_collection("products", limit=3)
            if products:
                items = [p.get("name", "Item") for p in products]
                activity_summary.append(f"New Products: {', '.join(items)}")

            # Check Classes (if TeacherApp)
            classes = await self.search_collection("classes", limit=3)
            if classes:
                cls_names = [c.get("name", "Class") for c in classes]
                activity_summary.append(f"Active Classes: {', '.join(cls_names)}")

            # Check Tickets
            tickets = await self.search_collection("tickets", filter_str="status='Open'", limit=3)
            if tickets:
                ticket_subjects = [t.get("subject", "Issue") for t in tickets]
                activity_summary.append(f"Open Tickets: {', '.join(ticket_subjects)}")

            # Check System Alerts
            alerts = await self.search_collection("system_alerts", filter_str="severity='critical'", limit=3)
            if alerts:
                alert_msgs = [a.get("message", "Alert") for a in alerts]
                activity_summary.append(f"CRITICAL ALERTS: {', '.join(alert_msgs)}")

        except Exception as e:
            return f"Error fetching activity: {str(e)}"

        return "\n".join(activity_summary) if activity_summary else "No recent activity found."
