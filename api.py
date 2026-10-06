from flask import Flask, jsonify
import pandas as pd

app = Flask(__name__)

# Load student results
df = pd.read_csv("student_results.csv")


# Home API
@app.route("/")
def home():
	return jsonify({
		"message": "Student Success API is running!",
		"total_students": len(df),
	})


# Get all students
@app.route("/students", methods=["GET"])
def get_students():
	return jsonify(df.to_dict(orient="records"))


# Get one student
@app.route("/students/<student_id>", methods=["GET"])
def get_student(student_id):
	student = df[df["student_id"].astype(str) == student_id]
	if student.empty:
		return jsonify({"error": "Student not found"}), 404
	return jsonify(student.iloc[0].to_dict())


# Get HIGH-risk students
@app.route("/students/high-risk", methods=["GET"])
def get_high_risk_students():
	students = df[df["risk"] == "HIGH"]
	return jsonify(students.to_dict(orient="records"))


# Get MEDIUM-risk students
@app.route("/students/medium-risk", methods=["GET"])
def get_medium_risk_students():
	students = df[df["risk"] == "MEDIUM"]
	return jsonify(students.to_dict(orient="records"))


# Get LOW-risk students
@app.route("/students/low-risk", methods=["GET"])
def get_low_risk_students():
	students = df[df["risk"] == "LOW"]
	return jsonify(students.to_dict(orient="records"))


# Dashboard summary
@app.route("/summary", methods=["GET"])
def summary():
	return jsonify({
		"total_students": len(df),
		"high_risk_students": len(df[df["risk"] == "HIGH"]),
		"medium_risk_students": len(df[df["risk"] == "MEDIUM"]),
		"low_risk_students": len(df[df["risk"] == "LOW"]),
		"average_success_score": round(df["success_score"].mean(), 2),
	})


if __name__ == "__main__":
	app.run(debug=True)
