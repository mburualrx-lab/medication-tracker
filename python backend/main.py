from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],
)

class Prescription(BaseModel):
    patient_id: int
    doctor_name: str
    medication_name: str
    dosage: str
    frequency: str

database_mock = []

@app.get("/")
def home():
    return {"message": "Your Medication Backend is running smoothly!"}

@app.post("/api/prescribe")
def add_medication(data: Prescription):
    database_mock.append(data.dict())
    print(f"\n[NEW PRESCRIPTION RECEIVED]: {data}\n")  
    return {"status": "success", "message": f"Successfully assigned {data.medication_name}."}

@app.get("/api/medications/{patient_id}")
def get_patient_medications(patient_id: int):
    patient_meds = [med for med in database_mock if med["patient_id"] == patient_id]
    return patient_meds


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)