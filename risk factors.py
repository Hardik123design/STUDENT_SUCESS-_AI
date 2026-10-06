import pandas as pd

# -----------------------------
# STEP 1: Load student results
# -----------------------------
df = pd.read_csv("student_results.csv")

# -----------------------------
# STEP 2: Find risk factors
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


# -----------------------------
# STEP 3: Add risk factors
# -----------------------------
df["risk_factors"] = df.apply(get_risk_factors, axis=1)

# -----------------------------
# STEP 4: Save final results
# -----------------------------
df.to_csv("student_results.csv", index=False)

# -----------------------------
# STEP 5: Display results
# -----------------------------
print("Risk factors calculated successfully!")
print()
print(df[["student_id", "success_score", "risk", "risk_factors"]])