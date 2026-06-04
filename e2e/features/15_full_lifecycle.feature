@full-lifecycle
Feature: Full Incident Lifecycle End-to-End

  # This scenario creates a fresh incident and walks it through all 4 stages
  # in a single flow, checking both the detail page and the incidents list at each step.

  @SCRUM-T103
  Scenario: Single incident progresses through all four lifecycle stages
    Given a fresh alert is submitted by "Staff" with title "Full E2E Lifecycle Test"

    When I log in as "School Admin"
    And I open the incident titled "Full E2E Lifecycle Test"
    Then the Ticket Progress shows "Unacknowledged" as the current step
    And the incident list shows "triggered" badge for that incident

    When I change the status to "acknowledged"
    Then the incident status shows "acknowledged"
    And the Ticket Progress shows "Acknowledged" as the current step
    And the incident list shows "acknowledged" badge for that incident

    When I change the status to "in-progress"
    Then the incident status shows "in-progress"
    And the Ticket Progress shows "In Progress" as the current step

    When I change the status to "resolved"
    Then the incident status shows "resolved"
    And the Ticket Progress shows "Resolved" as the current step
    And the incident is no longer visible in the active incidents list
    And the Dashboard no longer shows it in the Unacknowledged Alerts section
