from fastapi import FastAPI  # pyright: ignore[reportMissingImports]
from pydantic import BaseModel  # pyright: ignore[reportMissingImports]
from typing import List, Dict, Any  # pyright: ignore[reportMissingImports]

app = FastAPI(title="EcoRide+ AI Service")

class Station(BaseModel):
  id: str
  lat: float
  lng: float
  count: int | None = 0  # pyright: ignore[reportGeneralTypeIssues]

class DemandRequest(BaseModel):
  stations: List[Station]
  history: List[Dict[str, Any]] = []

@app.post('/forecast')
async def forecast(req: DemandRequest):
  forecasts = [ { 'stationId': s.id, 'demandScore': (s.count or 0) } for s in req.stations ]
  return { 'forecasts': forecasts }

@app.post('/recommendations')
async def recommendations(data: Dict[str, Any]):
  return { 'recommendations': [] }
