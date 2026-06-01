@export
Feature: CSV Export on Incidents Page

  # Incidents.jsx: Export button visible to isCompanyAdmin || isSchoolAdmin, disabled when filtered list is empty
  # Staff sees "Submit Alert" button instead — no Export

  Scenario: Export button is visible and enabled for School Admin when incidents exist
    Given I am logged in as "School Admin"
    And at least one incident exists in the system
    When I view the Incidents page
    Then I see the Export button
    And the Export button is enabled

  Scenario: Export button is disabled when the filtered list is empty
    Given I am logged in as "School Admin"
    When I view the Incidents page
    And I apply a filter that produces no results
    Then the Export button is disabled

  Scenario: Staff does not see the Export button
    Given I am logged in as "Staff"
    When I view the Incidents page
    Then I do not see the Export button
    And I see a Submit Alert shortcut button on the Incidents page

  Scenario: Export button triggers a file download
    Given I am logged in as "School Admin"
    And at least one incident exists in the system
    When I view the Incidents page
    And I click the Export button
    Then a CSV file download is initiated
