import pandas as pd

# -----------------------------
# STEP 1: Load student data
# -----------------------------
df = pd.read_csv("students.csv")

# -----------------------------
# STEP 2: Calculate Success Score
# -----------------------------
df["success_score"] = (
    (df["cgpa"] * 10 * 0.20)
    + (df["attendance"] * 0.15)
    + (df["lms_score"] * 0.15)
    + (df["engagement"] * 0.10)
    + (df["coding_score"] * 0.10)
    + (df["skills_score"] * 0.10)
    + (df["placement_score"] * 0.10)
    + (df["feedback_score"] * 0.10)
)
df["success_score"] = df["success_score"].round(2)

# -----------------------------
# STEP 3: Determine Risk Level
# -----------------------------
def get_risk_level(score):
    if score >= 80:
        return "LOW"
    elif score >= 60:
        return "MEDIUM"
    return "HIGH"


df["risk"] = df["success_score"].apply(get_risk_level)

# -----------------------------
# STEP 4: Find Risk Factors
# -----------------------------
def get_risk_factors(row):
    factors = []
    if row["attendance"] < 60:
        factors.append("Low attendance")
    if row["lms_score"] < 50:
        factors.append("Low LMS performance")
    if row["engagement"] < 50:
        factors.append("Low engagement")
    if row["coding_score"] < 50:
        factors.append("Low coding performance")
    if row["skills_score"] < 50:
        factors.append("Low skills score")
    if row["placement_score"] < 50:
        factors.append("Low placement readiness")
    if row["feedback_score"] < 50:
        factors.append("Low feedback score")
    if not factors:
        factors.append("No major risk factors")
    return ", ".join(factors)


df["risk_factors"] = df.apply(get_risk_factors, axis=1)

# -----------------------------
# STEP 5: Save the results
# -----------------------------
df.to_csv("student_results.csv", index=False)

# -----------------------------
# STEP 6: Display results
# -----------------------------
print("Success Score calculated successfully!")
print()
print(
    df[
        [
            "student_id",
            "department",
            "success_score",
            "risk",
            "risk_factors",
        ]
    ]
)