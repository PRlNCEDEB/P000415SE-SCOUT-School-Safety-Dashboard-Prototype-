@setup
Feature: Setup Page

  Scenario: Company Admin sees Alert Configuration and System-wide Configuration
    Given I am logged in as "Company Admin"
    When I navigate to "/setup"
    Then I see an "Alert Types" configuration section
    And I see a "Locations" configuration section
    And I see a "System-wide Configuration" section
    And the system-wide Save button is active

  Scenario: Company Admin can update the overdue threshold setting
    Given I am logged in as "Company Admin"
    And I am on the Setup page
    Then the overdue threshold input is enabled and editable
    And the retention period input is enabled and editable

  Scenario: Company Admin can trigger the archive job manually
    Given I am logged in as "Company Admin"
    And I am on the Setup page
    When I click the "Archive Now" button
    Then I see an archive result message

  Scenario: School Admin sees Alert Recipients section only
    Given I am logged in as "School Admin"
    When I navigate to "/setup"
    Then I see the "Alert Recipients" section
    And I do not see a "System-wide Configuration" section
    And I do not see an "Alert Types" configuration section

  Scenario: School Admin can configure routing for an emergency type
    Given I am logged in as "School Admin"
    And I am on the Setup page
    When I select an emergency type from the routing dropdown
    Then I see the current recipients for that alert type
    And I can add school users as recipients

  Scenario: Staff cannot access the Setup page
    Given I am logged in as "Staff"
    When I navigate to "/setup"
    Then I am redirected to "/dashboard"
