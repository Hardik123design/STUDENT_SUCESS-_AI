import os
from pathlib import Path

import pandas as pd
from flask import Flask, jsonify, request

app = Flask(__name__)
df = pd.read_csv(Path(__file__).with_name("student_results.csv"))


@app.after_request
def add_cors_headers(response):
    origin = request.headers.get("Origin")
    frontend_origin = os.environ.get(
        "FRONTEND_ORIGIN",
        "https://hardik123design.github.io",
    ).rstrip("/")
    allowed_origins = {
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        frontend_origin,
    }
    if origin in allowed_origins:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Vary"] = "Origin"
        response.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return response


@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "Student Success API is running!",
        "total_students": len(df),
    })


@app.route("/students", methods=["GET"])
def get_students():
    return jsonify(df.to_dict(orient="records"))


@app.route("/students/<student_id>", methods=["GET"])
def get_student(student_id):
    student = df[df["student_id"].astype(str) == student_id]
    if student.empty:
        return jsonify({"error": "Student not found"}), 404
    return jsonify(student.iloc[0].to_dict())


@app.route("/students/high-risk", methods=["GET"])
def get_high_risk_students():
    return jsonify(df[df["risk"] == "HIGH"].to_dict(orient="records"))


@app.route("/students/medium-risk", methods=["GET"])
def get_medium_risk_students():
    return jsonify(df[df["risk"] == "MEDIUM"].to_dict(orient="records"))


@app.route("/students/low-risk", methods=["GET"])
def get_low_risk_students():
    return jsonify(df[df["risk"] == "LOW"].to_dict(orient="records"))


@app.route("/summary", methods=["GET"])
def get_summary():
    return jsonify({
        "total_students": len(df),
        "high_risk_students": int((df["risk"] == "HIGH").sum()),
        "medium_risk_students": int((df["risk"] == "MEDIUM").sum()),
        "low_risk_students": int((df["risk"] == "LOW").sum()),
        "average_success_score": round(df["success_score"].mean(), 2),
    })


@app.route("/analytics/departments", methods=["GET"])
def department_analytics():
    department_data = (
        df.groupby("department")
        .agg(
            total_students=("student_id", "count"),
            average_success_score=("success_score", "mean"),
        )
        .reset_index()
    )
    department_data["average_success_score"] = department_data["average_success_score"].round(2)
    return jsonify(department_data.to_dict(orient="records"))


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", "5000")),
        debug=False,
    )
