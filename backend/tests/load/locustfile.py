"""LifeRoute 2.0 load harness — locust -f backend/tests/load/locustfile.py."""

from locust import HttpUser, between, task


class TriageUser(HttpUser):
    wait_time = between(1, 3)

    @task(3)
    def health(self):
        self.client.get("/api/v2/health")

    @task(5)
    def nearby(self):
        self.client.get("/api/v2/hospitals/nearby")

    @task(2)
    def sos(self):
        self.client.post(
            "/api/v2/emergency/sos",
            json={"input": "unconscious not breathing", "location": {"lat": 28.6139, "lng": 77.209}},
        )
