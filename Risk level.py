import pandas as pd

# -----------------------------
# STEP 1: Load scoring results
# -----------------------------
df = pd.read_csv("student_results.csv")

# -----------------------------
# STEP 2: Calculate Risk Level
# -----------------------------
def get_risk_level(score):
	if score >= 80:
		return "LOW"
	elif score >= 60:
		return "MEDIUM"
	else:
		return "HIGH"


df["risk"] = df["success_score"].apply(get_risk_level)

# -----------------------------
# STEP 3: Save updated results
# -----------------------------
df.to_csv("student_results.csv", index=False)

# -----------------------------
# STEP 4: Display risk results
# -----------------------------
print("Risk levels calculated successfully!")
print()
print(df[["student_id", "success_score", "risk"]])

# -----------------------------
# STEP 5: Show risk summary
# -----------------------------
print()
print("Risk Summary:")
print(df["risk"].value_counts())
