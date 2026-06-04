@lifecycle
Feature: Incident Lifecycle

  @SCRUM-T45
  Scenario: Incident status changes from triggered to acknowledged
    Given I am logged in as "School Admin"
    And a triggered incident exists
    When I change the status to "acknowledged"
    Then the incident status shows "acknowledged"
    And the acknowledgedBy array is populated with the admin's name, email, role, and acknowledgedAt
    And the Responded badge is visible on the incident list row

  @SCRUM-T46
  Scenario: Incident status changes from acknowledged to in-progress
    Given I am logged in as "School Admin"
    And an acknowledged incident exists
    When I change the status to "in-progress"
    Then the incident status shows "in-progress"
    And the inProgressBy array is populated

  @SCRUM-T47
  Scenario: Incident status changes from in-progress to resolved
    Given I am logged in as "School Admin"
    And an in-progress incident exists
    When I change the status to "resolved"
    Then the incident status shows "resolved"
    And the incident is no longer in the active or unacknowledged sections on the dashboard

  @SCRUM-T48
  Scenario: Staff cannot change incident status
    Given I am logged in as "Staff"
    And I open an incident I submitted
    Then I do not see any status-change controls
    And the incident is read-only

  @SCRUM-T49
  Scenario: Staff cannot edit cancel or reroute a submitted alert
    Given I am logged in as "Staff"
    When I open an incident I submitted
    Then I do not see edit, cancel, reassign, or routing buttons

  @SCRUM-T50
  Scenario: Staff can see the status of their own submitted alerts
    Given I am logged in as "Staff"
    And I have submitted an alert
    When I view the incident detail page for that alert
    Then I can see the current status
    And status transitions triggered to acknowledged to resolved are visible

  @SCRUM-T51
  Scenario: Incident status persists after page refresh
    Given I am logged in as "School Admin"
    And I have changed an incident status to "acknowledged"
    When I refresh the page
    Then the incident status still shows "acknowledged"
