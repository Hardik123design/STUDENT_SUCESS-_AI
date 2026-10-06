# Student Success Score and Support Insights

## Score formula

The prototype uses an interpretable weighted score on a 0-100 scale. CGPA is first
normalized from its 0-10 scale to 0-100; the other input indicators are already
treated as 0-100 values.

| Indicator | Weight |
| --- | ---: |
| CGPA | 20% |
| Attendance | 15% |
| LMS performance | 15% |
| Engagement | 10% |
| Coding | 10% |
| Skills | 10% |
| Placement readiness | 10% |
| Student feedback | 10% |

For each indicator, its score contribution is `normalized indicator x weight`.
The Student Success Score is the sum of those contributions. The API returns
each normalized input, its weight, and its contribution so faculty can inspect
how a student's score was formed.

## Risk bands and drivers

- **LOW:** score of 80 or above
- **MEDIUM:** score from 60 to below 80
- **HIGH:** score below 60

Student-level risk drivers are surfaced when CGPA is below 6.5, attendance is
below 75%, LMS performance is below 60, engagement is below 50, placement
readiness is below 60, or coding, skills, or feedback is below 50. These
indicator thresholds explain potential support needs; they do not replace the
overall score band.

Placement risk is classified separately from academic success risk:

- **HIGH:** placement readiness below 50 or coding below 50
- **MEDIUM:** placement readiness below 70 or coding below 60, unless HIGH
- **LOW:** placement readiness is at least 70 and coding is at least 60

The `/students/placement-risk` endpoint lists students in the HIGH and MEDIUM
placement bands. This is a rules-based readiness indicator, not a prediction of
placement outcomes.

## Student segments

Each student is assigned one mutually exclusive support segment in this
precedence order:

1. Strong academics, placement support: CGPA at least 8 and placement readiness
   below 65.
2. Placement ready: CGPA at least 7, placement readiness at least 75, and coding
   at least 70.
3. Academic recovery: CGPA below 6.5 or success score below 60.
4. Engagement support: attendance below 75, LMS performance below 60, or
   engagement below 50.
5. Balanced progress: none of the above rules apply.

Segments include a suggested faculty follow-up. They are intended to guide
review and prioritization, not to trigger automatic student decisions.

## Scope and limitations

This is a rule-based prototype over the available CSV fields. It does not use
historical outcomes, train or validate a predictive model, establish causality,
or integrate live college systems. Scores and thresholds should be reviewed
with faculty and calibrated against institution-specific outcomes before
operational use.
