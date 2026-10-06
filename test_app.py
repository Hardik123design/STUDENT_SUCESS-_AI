import unittest

from app import SEGMENTS, app, df, get_placement_risk, get_segment


class StudentInsightsApiTests(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_student_response_explains_weighted_success_score(self):
        response = self.client.get("/students/STU001")
        self.assertEqual(response.status_code, 200)
        student = response.get_json()
        contributions = sum(
            factor["contribution"] for factor in student["score_breakdown"]
        )
        self.assertAlmostEqual(contributions, student["success_score"], places=2)
        self.assertEqual(len(student["score_breakdown"]), 8)

    def test_segments_cover_each_student_once(self):
        response = self.client.get("/analytics/segments")
        self.assertEqual(response.status_code, 200)
        segments = response.get_json()
        self.assertEqual({segment["segment"] for segment in segments}, set(SEGMENTS))
        self.assertEqual(sum(segment["student_count"] for segment in segments), len(df))

    def test_strong_academic_low_placement_segment_has_priority(self):
        student = {
            "cgpa": 8.5,
            "placement_score": 55,
            "coding_score": 60,
            "success_score": 75,
            "attendance": 90,
            "lms_score": 80,
            "engagement": 70,
        }
        self.assertEqual(get_segment(student), "academic_placement_support")

    def test_scoring_methodology_weights_sum_to_one(self):
        response = self.client.get("/analytics/scoring")
        self.assertEqual(response.status_code, 200)
        methodology = response.get_json()
        self.assertAlmostEqual(
            sum(factor["weight"] for factor in methodology["factors"]), 1.0
        )
        self.assertIn("not a validated prediction model", methodology["note"])

    def test_student_response_includes_explainable_risk_drivers(self):
        high_risk_id = df.loc[df["risk"] == "HIGH", "student_id"].iloc[0]
        response = self.client.get(f"/students/{high_risk_id}")
        self.assertEqual(response.status_code, 200)
        student = response.get_json()
        self.assertEqual(student["risk"], "HIGH")
        self.assertTrue(student["risk_drivers"])
        self.assertIn(student["segment"], SEGMENTS)

    def test_placement_risk_uses_placement_and_coding_thresholds(self):
        self.assertEqual(
            get_placement_risk({"placement_score": 49, "coding_score": 80}),
            "HIGH",
        )
        self.assertEqual(
            get_placement_risk({"placement_score": 70, "coding_score": 59}),
            "MEDIUM",
        )
        self.assertEqual(
            get_placement_risk({"placement_score": 70, "coding_score": 60}),
            "LOW",
        )

    def test_placement_risk_endpoint_and_summary_agree(self):
        risky_response = self.client.get("/students/placement-risk")
        summary_response = self.client.get("/summary")
        self.assertEqual(risky_response.status_code, 200)
        self.assertEqual(summary_response.status_code, 200)
        risky_students = risky_response.get_json()
        summary = summary_response.get_json()
        self.assertEqual(len(risky_students), summary["placement_risk_students"])
        self.assertTrue(all(student["placement_risk"] != "LOW" for student in risky_students))


if __name__ == "__main__":
    unittest.main()
