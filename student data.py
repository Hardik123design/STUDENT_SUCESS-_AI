import pandas as pd

# 50 student records
students = [
    {
        "student_id": "STU001",
        "department": "CSE",
        "cgpa": 9.2,
        "attendance": 94,
        "lms_score": 91,
        "engagement": 88,
        "coding_score": 92,
        "skills_score": 90,
        "placement_score": 89,
        "feedback_score": 93
    },
    {
        "student_id": "STU002",
        "department": "CSE",
        "cgpa": 8.8,
        "attendance": 89,
        "lms_score": 86,
        "engagement": 84,
        "coding_score": 85,
        "skills_score": 87,
        "placement_score": 83,
        "feedback_score": 88
    },
    {
        "student_id": "STU003",
        "department": "ECE",
        "cgpa": 8.5,
        "attendance": 91,
        "lms_score": 84,
        "engagement": 82,
        "coding_score": 80,
        "skills_score": 85,
        "placement_score": 81,
        "feedback_score": 86
    },
    {
        "student_id": "STU004",
        "department": "ME",
        "cgpa": 7.9,
        "attendance": 82,
        "lms_score": 78,
        "engagement": 75,
        "coding_score": 72,
        "skills_score": 77,
        "placement_score": 70,
        "feedback_score": 80
    },
    {
        "student_id": "STU005",
        "department": "CIVIL",
        "cgpa": 7.5,
        "attendance": 78,
        "lms_score": 72,
        "engagement": 70,
        "coding_score": 65,
        "skills_score": 71,
        "placement_score": 63,
        "feedback_score": 76
    },
    {
        "student_id": "STU006",
        "department": "CSE",
        "cgpa": 9.0,
        "attendance": 96,
        "lms_score": 94,
        "engagement": 91,
        "coding_score": 95,
        "skills_score": 92,
        "placement_score": 94,
        "feedback_score": 95
    },
    {
        "student_id": "STU007",
        "department": "ECE",
        "cgpa": 8.2,
        "attendance": 85,
        "lms_score": 80,
        "engagement": 78,
        "coding_score": 76,
        "skills_score": 81,
        "placement_score": 75,
        "feedback_score": 82
    },
    {
        "student_id": "STU008",
        "department": "CSE",
        "cgpa": 7.1,
        "attendance": 68,
        "lms_score": 62,
        "engagement": 65,
        "coding_score": 58,
        "skills_score": 61,
        "placement_score": 55,
        "feedback_score": 70
    },
    {
        "student_id": "STU009",
        "department": "ME",
        "cgpa": 6.8,
        "attendance": 61,
        "lms_score": 55,
        "engagement": 58,
        "coding_score": 52,
        "skills_score": 54,
        "placement_score": 48,
        "feedback_score": 65
    },
    {
        "student_id": "STU010",
        "department": "CIVIL",
        "cgpa": 6.2,
        "attendance": 55,
        "lms_score": 48,
        "engagement": 51,
        "coding_score": 45,
        "skills_score": 49,
        "placement_score": 42,
        "feedback_score": 58
    },

    # Students 11-20
    {
        "student_id": "STU011",
        "department": "CSE",
        "cgpa": 8.7,
        "attendance": 92,
        "lms_score": 89,
        "engagement": 86,
        "coding_score": 88,
        "skills_score": 90,
        "placement_score": 85,
        "feedback_score": 91
    },
    {
        "student_id": "STU012",
        "department": "ECE",
        "cgpa": 7.8,
        "attendance": 79,
        "lms_score": 74,
        "engagement": 72,
        "coding_score": 68,
        "skills_score": 73,
        "placement_score": 65,
        "feedback_score": 78
    },
    {
        "student_id": "STU013",
        "department": "ME",
        "cgpa": 8.1,
        "attendance": 84,
        "lms_score": 81,
        "engagement": 79,
        "coding_score": 77,
        "skills_score": 80,
        "placement_score": 74,
        "feedback_score": 83
    },
    {
        "student_id": "STU014",
        "department": "CIVIL",
        "cgpa": 7.3,
        "attendance": 73,
        "lms_score": 68,
        "engagement": 66,
        "coding_score": 60,
        "skills_score": 65,
        "placement_score": 58,
        "feedback_score": 72
    },
    {
        "student_id": "STU015",
        "department": "CSE",
        "cgpa": 6.5,
        "attendance": 58,
        "lms_score": 52,
        "engagement": 49,
        "coding_score": 43,
        "skills_score": 51,
        "placement_score": 40,
        "feedback_score": 60
    },
    {
        "student_id": "STU016",
        "department": "ECE",
        "cgpa": 9.1,
        "attendance": 95,
        "lms_score": 92,
        "engagement": 90,
        "coding_score": 91,
        "skills_score": 94,
        "placement_score": 90,
        "feedback_score": 94
    },
    {
        "student_id": "STU017",
        "department": "CSE",
        "cgpa": 8.4,
        "attendance": 87,
        "lms_score": 83,
        "engagement": 81,
        "coding_score": 79,
        "skills_score": 84,
        "placement_score": 78,
        "feedback_score": 86
    },
    {
        "student_id": "STU018",
        "department": "ME",
        "cgpa": 7.6,
        "attendance": 76,
        "lms_score": 71,
        "engagement": 69,
        "coding_score": 64,
        "skills_score": 70,
        "placement_score": 60,
        "feedback_score": 74
    },
    {
        "student_id": "STU019",
        "department": "CIVIL",
        "cgpa": 6.9,
        "attendance": 64,
        "lms_score": 59,
        "engagement": 55,
        "coding_score": 50,
        "skills_score": 57,
        "placement_score": 46,
        "feedback_score": 67
    },
    {
        "student_id": "STU020",
        "department": "CSE",
        "cgpa": 5.9,
        "attendance": 48,
        "lms_score": 42,
        "engagement": 45,
        "coding_score": 38,
        "skills_score": 44,
        "placement_score": 35,
        "feedback_score": 52
    },

    # Students 21-30
    {
        "student_id": "STU021",
        "department": "ECE",
        "cgpa": 8.9,
        "attendance": 93,
        "lms_score": 90,
        "engagement": 87,
        "coding_score": 89,
        "skills_score": 91,
        "placement_score": 88,
        "feedback_score": 92
    },
    {
        "student_id": "STU022",
        "department": "CSE",
        "cgpa": 8.0,
        "attendance": 81,
        "lms_score": 77,
        "engagement": 75,
        "coding_score": 73,
        "skills_score": 76,
        "placement_score": 69,
        "feedback_score": 80
    },
    {
        "student_id": "STU023",
        "department": "ME",
        "cgpa": 7.2,
        "attendance": 67,
        "lms_score": 61,
        "engagement": 63,
        "coding_score": 55,
        "skills_score": 60,
        "placement_score": 52,
        "feedback_score": 68
    },
    {
        "student_id": "STU024",
        "department": "CIVIL",
        "cgpa": 6.4,
        "attendance": 52,
        "lms_score": 46,
        "engagement": 48,
        "coding_score": 41,
        "skills_score": 45,
        "placement_score": 38,
        "feedback_score": 55
    },
    {
        "student_id": "STU025",
        "department": "CSE",
        "cgpa": 9.3,
        "attendance": 97,
        "lms_score": 95,
        "engagement": 93,
        "coding_score": 96,
        "skills_score": 95,
        "placement_score": 96,
        "feedback_score": 97
    },
    {
        "student_id": "STU026",
        "department": "ECE",
        "cgpa": 8.6,
        "attendance": 88,
        "lms_score": 85,
        "engagement": 83,
        "coding_score": 82,
        "skills_score": 86,
        "placement_score": 80,
        "feedback_score": 87
    },
    {
        "student_id": "STU027",
        "department": "CSE",
        "cgpa": 7.7,
        "attendance": 74,
        "lms_score": 69,
        "engagement": 71,
        "coding_score": 66,
        "skills_score": 68,
        "placement_score": 61,
        "feedback_score": 75
    },
    {
        "student_id": "STU028",
        "department": "ME",
        "cgpa": 6.7,
        "attendance": 59,
        "lms_score": 51,
        "engagement": 54,
        "coding_score": 47,
        "skills_score": 50,
        "placement_score": 43,
        "feedback_score": 62
    },
    {
        "student_id": "STU029",
        "department": "CIVIL",
        "cgpa": 7.0,
        "attendance": 70,
        "lms_score": 64,
        "engagement": 62,
        "coding_score": 57,
        "skills_score": 63,
        "placement_score": 50,
        "feedback_score": 69
    },
    {
        "student_id": "STU030",
        "department": "CSE",
        "cgpa": 8.3,
        "attendance": 86,
        "lms_score": 82,
        "engagement": 80,
        "coding_score": 78,
        "skills_score": 83,
        "placement_score": 77,
        "feedback_score": 85
    },

    # Students 31-40
    {
        "student_id": "STU031",
        "department": "ECE",
        "cgpa": 7.4,
        "attendance": 72,
        "lms_score": 67,
        "engagement": 65,
        "coding_score": 59,
        "skills_score": 64,
        "placement_score": 55,
        "feedback_score": 71
    },
    {
        "student_id": "STU032",
        "department": "CSE",
        "cgpa": 6.1,
        "attendance": 54,
        "lms_score": 49,
        "engagement": 46,
        "coding_score": 40,
        "skills_score": 47,
        "placement_score": 36,
        "feedback_score": 57
    },
    {
        "student_id": "STU033",
        "department": "ME",
        "cgpa": 8.0,
        "attendance": 83,
        "lms_score": 79,
        "engagement": 77,
        "coding_score": 74,
        "skills_score": 78,
        "placement_score": 71,
        "feedback_score": 81
    },
    {
        "student_id": "STU034",
        "department": "CIVIL",
        "cgpa": 7.8,
        "attendance": 80,
        "lms_score": 76,
        "engagement": 73,
        "coding_score": 69,
        "skills_score": 75,
        "placement_score": 66,
        "feedback_score": 79
    },
    {
        "student_id": "STU035",
        "department": "CSE",
        "cgpa": 9.0,
        "attendance": 92,
        "lms_score": 91,
        "engagement": 89,
        "coding_score": 90,
        "skills_score": 91,
        "placement_score": 88,
        "feedback_score": 93
    },
    {
        "student_id": "STU036",
        "department": "ECE",
        "cgpa": 6.6,
        "attendance": 57,
        "lms_score": 53,
        "engagement": 50,
        "coding_score": 44,
        "skills_score": 52,
        "placement_score": 41,
        "feedback_score": 59
    },
    {
        "student_id": "STU037",
        "department": "ME",
        "cgpa": 7.5,
        "attendance": 75,
        "lms_score": 70,
        "engagement": 68,
        "coding_score": 63,
        "skills_score": 69,
        "placement_score": 57,
        "feedback_score": 73
    },
    {
        "student_id": "STU038",
        "department": "CIVIL",
        "cgpa": 8.2,
        "attendance": 85,
        "lms_score": 81,
        "engagement": 79,
        "coding_score": 76,
        "skills_score": 82,
        "placement_score": 74,
        "feedback_score": 84
    },
    {
        "student_id": "STU039",
        "department": "CSE",
        "cgpa": 7.0,
        "attendance": 63,
        "lms_score": 58,
        "engagement": 56,
        "coding_score": 51,
        "skills_score": 55,
        "placement_score": 47,
        "feedback_score": 66
    },
    {
        "student_id": "STU040",
        "department": "ECE",
        "cgpa": 5.8,
        "attendance": 46,
        "lms_score": 40,
        "engagement": 43,
        "coding_score": 35,
        "skills_score": 42,
        "placement_score": 32,
        "feedback_score": 50
    },

    # Students 41-50
    {
        "student_id": "STU041",
        "department": "CSE",
        "cgpa": 8.9,
        "attendance": 90,
        "lms_score": 87,
        "engagement": 85,
        "coding_score": 86,
        "skills_score": 89,
        "placement_score": 84,
        "feedback_score": 91
    },
    {
        "student_id": "STU042",
        "department": "ME",
        "cgpa": 7.9,
        "attendance": 78,
        "lms_score": 75,
        "engagement": 72,
        "coding_score": 70,
        "skills_score": 74,
        "placement_score": 65,
        "feedback_score": 79
    },
    {
        "student_id": "STU043",
        "department": "CIVIL",
        "cgpa": 6.8,
        "attendance": 62,
        "lms_score": 56,
        "engagement": 59,
        "coding_score": 49,
        "skills_score": 55,
        "placement_score": 45,
        "feedback_score": 64
    },
    {
        "student_id": "STU044",
        "department": "CSE",
        "cgpa": 8.5,
        "attendance": 88,
        "lms_score": 84,
        "engagement": 82,
        "coding_score": 81,
        "skills_score": 85,
        "placement_score": 80,
        "feedback_score": 87
    },
    {
        "student_id": "STU045",
        "department": "ECE",
        "cgpa": 7.2,
        "attendance": 69,
        "lms_score": 63,
        "engagement": 61,
        "coding_score": 56,
        "skills_score": 62,
        "placement_score": 51,
        "feedback_score": 70
    },
    {
        "student_id": "STU046",
        "department": "ME",
        "cgpa": 6.0,
        "attendance": 50,
        "lms_score": 44,
        "engagement": 47,
        "coding_score": 39,
        "skills_score": 46,
        "placement_score": 34,
        "feedback_score": 54
    },
    {
        "student_id": "STU047",
        "department": "CIVIL",
        "cgpa": 7.6,
        "attendance": 77,
        "lms_score": 73,
        "engagement": 70,
        "coding_score": 65,
        "skills_score": 72,
        "placement_score": 59,
        "feedback_score": 76
    },
    {
        "student_id": "STU048",
        "department": "CSE",
        "cgpa": 9.1,
        "attendance": 94,
        "lms_score": 93,
        "engagement": 90,
        "coding_score": 92,
        "skills_score": 94,
        "placement_score": 91,
        "feedback_score": 95
    },
    {
        "student_id": "STU049",
        "department": "ECE",
        "cgpa": 8.1,
        "attendance": 82,
        "lms_score": 78,
        "engagement": 76,
        "coding_score": 74,
        "skills_score": 79,
        "placement_score": 70,
        "feedback_score": 82
    },
    {
        "student_id": "STU050",
        "department": "CSE",
        "cgpa": 6.3,
        "attendance": 56,
        "lms_score": 50,
        "engagement": 52,
        "coding_score": 42,
        "skills_score": 48,
        "placement_score": 39,
        "feedback_score": 58
    }
]


# Convert the list into a DataFrame
df = pd.DataFrame(students)

# Save as CSV
df.to_csv("students.csv", index=False)

print("Student data created successfully!")
print(f"Total students: {len(df)}")
print("\nStudent data:")
print(df)
