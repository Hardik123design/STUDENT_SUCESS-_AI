import os
from flask import Flask, jsonify, request
import pandas as pd
from pathlib import Path

app = Flask(__name__)

# Load the data file relative to this module so the API works from any directory.
df = pd.read_csv(Path(__file__).with_name("student_results.csv"))

SCORE_FACTORS = (
	("cgpa", "Academic performance (CGPA)", 0.20, 10),
	("attendance", "Attendance", 0.15, 1),
	("lms_score", "LMS performance", 0.15, 1),
	("engagement", "Engagement", 0.10, 1),
	("coding_score", "Coding", 0.10, 1),
	("skills_score", "Skills", 0.10, 1),
	("placement_score", "Placement readiness", 0.10, 1),
	("feedback_score", "Student feedback", 0.10, 1),
)

SEGMENTS = {
	"academic_placement_support": {
		"label": "Strong academics, placement support",
		"description": "Strong CGPA with a placement-readiness gap.",
		"action": "Offer aptitude practice, coding interviews, and mock-placement sessions.",
	},
	"placement_ready": {
		"label": "Placement ready",
		"description": "Strong academic foundation, coding, and placement-readiness scores.",
		"action": "Connect with relevant placement opportunities and advanced interview practice.",
	},
	"academic_recovery": {
		"label": "Academic recovery",
		"description": "Low overall success score or CGPA indicates a need for academic support.",
		"action": "Review subject-level performance and agree on a faculty-led study plan.",
	},
	"engagement_support": {
		"label": "Engagement support",
		"description": "Attendance, LMS activity, or engagement is below its support threshold.",
		"action": "Check for barriers to participation and set a short-term engagement goal.",
	},
	"balanced_progress": {
		"label": "Balanced progress",
		"description": "No segment-specific support trigger is currently present.",
		"action": "Continue regular progress reviews and encourage development opportunities.",
	},
}


def get_segment(row):
	if row["cgpa"] >= 8 and row["placement_score"] < 65:
		return "academic_placement_support"
	if row["cgpa"] >= 7 and row["placement_score"] >= 75 and row["coding_score"] >= 70:
		return "placement_ready"
	if row["cgpa"] < 6.5 or row["success_score"] < 60:
		return "academic_recovery"
	if row["attendance"] < 75 or row["lms_score"] < 60 or row["engagement"] < 50:
		return "engagement_support"
	return "balanced_progress"


def get_placement_risk(row):
	if row["placement_score"] < 50 or row["coding_score"] < 50:
		return "HIGH"
	if row["placement_score"] < 70 or row["coding_score"] < 60:
		return "MEDIUM"
	return "LOW"


def get_student_insights(row):
	record = row.to_dict()
	score_breakdown = []
	for column, label, weight, scale in SCORE_FACTORS:
		value = float(row[column])
		normalized_value = value * scale
		score_breakdown.append({
			"key": column,
			"label": label,
			"value": round(value, 2),
			"normalized_value": round(normalized_value, 2),
			"unit": "/10" if column == "cgpa" else "%",
			"weight": weight,
			"contribution": round(normalized_value * weight, 2),
		})

	risk_drivers = []
	risk_thresholds = (
		("cgpa", "CGPA", 6.5, "below"),
		("attendance", "Attendance", 75, "below"),
		("lms_score", "LMS performance", 60, "below"),
		("engagement", "Engagement", 50, "below"),
		("placement_score", "Placement readiness", 60, "below"),
		("coding_score", "Coding", 50, "below"),
		("skills_score", "Skills", 50, "below"),
		("feedback_score", "Feedback", 50, "below"),
	)
	for column, label, threshold, _ in risk_thresholds:
		value = float(row[column])
		if value < threshold:
			risk_drivers.append({
				"key": column,
				"label": label,
				"value": round(value, 2),
				"threshold": threshold,
				"message": f"{label} is {value:g}, below the support threshold of {threshold:g}.",
			})
	if not risk_drivers and row["risk"] != "LOW":
		risk_threshold = 60 if row["risk"] == "HIGH" else 80
		risk_drivers.append({
			"key": "success_score",
			"label": "Overall success score",
			"value": round(float(row["success_score"]), 2),
			"threshold": risk_threshold,
			"message": (
				f"The overall success score is below the {row['risk'].lower()}-risk "
				f"band threshold of {risk_threshold}."
			),
		})

	segment_key = get_segment(row)
	record["score_breakdown"] = score_breakdown
	record["risk_drivers"] = risk_drivers
	record["segment"] = segment_key
	record["segment_label"] = SEGMENTS[segment_key]["label"]
	record["segment_description"] = SEGMENTS[segment_key]["description"]
	record["recommended_action"] = SEGMENTS[segment_key]["action"]
	record["placement_risk"] = get_placement_risk(row)
	return record


def enriched_records(dataframe):
	return [get_student_insights(row) for _, row in dataframe.iterrows()]


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
	return jsonify(enriched_records(df))


@app.route("/students/<student_id>", methods=["GET"])
def get_student(student_id):
	student = df[df["student_id"].astype(str) == student_id]
	if student.empty:
		return jsonify({"error": "Student not found"}), 404
	return jsonify(get_student_insights(student.iloc[0]))


@app.route("/students/high-risk", methods=["GET"])
def get_high_risk_students():
	return jsonify(enriched_records(df[df["risk"] == "HIGH"]))


@app.route("/students/medium-risk", methods=["GET"])
def get_medium_risk_students():
	return jsonify(enriched_records(df[df["risk"] == "MEDIUM"]))


@app.route("/students/low-risk", methods=["GET"])
def get_low_risk_students():
	return jsonify(enriched_records(df[df["risk"] == "LOW"]))


@app.route("/summary", methods=["GET"])
def get_summary():
	return jsonify({
		"total_students": len(df),
		"high_risk_students": int((df["risk"] == "HIGH").sum()),
		"medium_risk_students": int((df["risk"] == "MEDIUM").sum()),
		"low_risk_students": int((df["risk"] == "LOW").sum()),
		"placement_risk_students": sum(
			get_placement_risk(row) in {"HIGH", "MEDIUM"}
			for _, row in df.iterrows()
		),
		"average_success_score": round(df["success_score"].mean(), 2),
	})


@app.route("/students/placement-risk", methods=["GET"])
def get_placement_risk_students():
	risky_students = df[
		df.apply(lambda row: get_placement_risk(row) in {"HIGH", "MEDIUM"}, axis=1)
	]
	return jsonify(enriched_records(risky_students))
# Department analytics
@app.route("/analytics/departments", methods=["GET"])
def department_analytics():
	department_data = (
		df.groupby("department")
		.agg(
			total_students=("student_id", "count"),
			average_success_score=("success_score", "mean")
		)
		.reset_index()
	)

	department_data["average_success_score"] = (
		department_data["average_success_score"].round(2)
	)

	return jsonify(department_data.to_dict(orient="records"))


@app.route("/analytics/segments", methods=["GET"])
def segment_analytics():
	records = enriched_records(df)
	analytics = []
	for segment_key, details in SEGMENTS.items():
		members = [record for record in records if record["segment"] == segment_key]
		analytics.append({
			"segment": segment_key,
			"label": details["label"],
			"description": details["description"],
			"recommended_action": details["action"],
			"student_count": len(members),
			"average_success_score": round(
				sum(record["success_score"] for record in members) / len(members), 2
			) if members else 0,
		})
	return jsonify(analytics)


@app.route("/analytics/scoring", methods=["GET"])
def scoring_methodology():
	return jsonify({
		"scale": "0-100",
		"factors": [
			{"key": key, "label": label, "weight": weight}
			for key, label, weight, _ in SCORE_FACTORS
		],
		"risk_thresholds": {
			"LOW": "success score >= 80",
			"MEDIUM": "60 <= success score < 80",
			"HIGH": "success score < 60",
		},
		"placement_risk_thresholds": {
			"LOW": "placement score >= 70 and coding score >= 60",
			"MEDIUM": "placement score 50-69 or coding score 50-59",
			"HIGH": "placement score < 50 or coding score < 50",
		},
		"note": (
			"Rule-based prototype indicators, not a validated prediction model. "
			"Faculty should review context before acting."
		),
	})


if __name__ == "__main__":
	app.run(
		host="0.0.0.0",
		port=int(os.environ.get("PORT", "5000")),
		debug=False,
	)
