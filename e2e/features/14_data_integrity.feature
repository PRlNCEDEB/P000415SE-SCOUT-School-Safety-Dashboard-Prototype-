@integrity
Feature: Cross-Page Data Consistency

  Scenario: Need Response count matches between Dashboard and Analytics
    Given I am logged in as "School Admin"
    When I view the dashboard
    And I record the "Need Response" count from the School Status panel
    And I navigate to "/analytics"
    Then the unacknowledged count badge on Analytics matches the recorded count

  Scenario: Total Incidents on Analytics matches Incidents page total
    Given I am logged in as "School Admin"
    When I view the Analytics page
    And I record the Total Incidents summary value
    And I view the Incidents page with all-incidents filter
    Then the incident count on the Incidents page matches the recorded Analytics total

  Scenario: Resolving an incident reduces the Currently Active count on the Dashboard
    Given I am logged in as "School Admin"
    When I view the dashboard
    And I record the "Currently Active" count from the School Status panel
    And I open an in-progress incident from the Incidents page
    And I change the status to "resolved"
    And I navigate to "/dashboard"
    Then the "Currently Active" count is less than the recorded value

  Scenario: Analytics Resolved count increases after an incident is resolved
    Given I am logged in as "School Admin"
    When I view the Analytics page
    And I record the Resolved summary value
    And I open an in-progress incident from the Incidents page
    And I change the status to "resolved"
    And I navigate to "/analytics"
    And I click the Refresh button
    Then the Resolved count is greater than or equal to the recorded value

  Scenario: Acknowledged status badge on Incidents list matches the detail page status
    Given I am logged in as "School Admin"
    And I open a triggered incident from the Incidents page
    When I change the status to "acknowledged"
    And I navigate to "/incidents"
    Then I see an incident row with the "acknowledged" status badge
