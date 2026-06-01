@overdue
Feature: Overdue Incident Flagging

  # Seeded triggered incidents are older than the default 15-minute threshold,
  # so they will naturally appear as overdue in a live deployment.

  Scenario: Overdue badge appears on incidents list for triggered incidents past threshold
    Given I am logged in as "School Admin"
    When I view the Incidents page filtered by triggered status
    Then I see the overdue badge on at least one incident row
    And the overdue incident row has an amber background highlight

  Scenario: Overdue warning banner appears on the incident detail page
    Given I am logged in as "School Admin"
    When I open the first triggered incident from the Incidents page
    Then I see the amber overdue warning banner
    And the banner contains the text "Alert overdue"

  Scenario: Dashboard shows overdue count badge in the Unacknowledged Alerts section
    Given I am logged in as "School Admin"
    When I view the dashboard
    Then I see the Unacknowledged Alerts section
    And I see an overdue count indicator next to the section heading

  Scenario: Company Admin can edit and save the overdue threshold on Setup page
    Given I am logged in as "Company Admin"
    And I am on the Setup page
    When I set the overdue threshold to 30
    And I save the global settings
    Then the settings are saved successfully
    And the overdue threshold input shows the value 30

  Scenario: Company Admin can edit and save the archive retention period
    Given I am logged in as "Company Admin"
    And I am on the Setup page
    When I set the retention period to 60
    And I save the global settings
    Then the settings are saved successfully
    And the retention period input shows the value 60
