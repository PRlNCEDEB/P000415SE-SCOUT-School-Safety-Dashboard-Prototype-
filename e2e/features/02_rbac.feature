@rbac
Feature: Role-Based Access Control

  Scenario: Role badge colour is distinct for each role
    Given I log in as "Company Admin"
    Then the role badge colour is red
    Given I log in as "School Admin"
    Then the role badge colour is purple
    Given I log in as "Staff"
    Then the role badge colour is blue

  Scenario: Company Admin sees only the Setup navigation link
    Given I am logged in as "Company Admin"
    Then I see only the Setup navigation link
    And I do not see a "Dashboard" navigation link
    And I do not see a "Submit Alert" navigation link
    And I do not see an "Analytics" navigation link

  Scenario: School Admin navigation includes all relevant sections
    Given I am logged in as "School Admin"
    Then I see navigation links for Dashboard, Submit Alert, Incidents, Analytics, Notifications, and Setup

  Scenario: Staff navigation shows Dashboard, Submit Alert, and Incidents
    Given I am logged in as "Staff"
    Then I see navigation links for Dashboard, Submit Alert, and Incidents only
    And I do not see links for Analytics, Notifications, or Setup

  Scenario: Staff is redirected when accessing Analytics page directly
    Given I am logged in as "Staff"
    When I navigate to "/analytics"
    Then I am redirected to "/dashboard"

  Scenario: Staff is redirected when accessing Setup page directly
    Given I am logged in as "Staff"
    When I navigate to "/setup"
    Then I am redirected to "/dashboard"

  Scenario: Company Admin is redirected when accessing Dashboard directly
    Given I am logged in as "Company Admin"
    When I navigate to "/dashboard"
    Then I am redirected to "/setup"

  Scenario: Company Admin is redirected when accessing Analytics directly
    Given I am logged in as "Company Admin"
    When I navigate to "/analytics"
    Then I am redirected to "/setup"
