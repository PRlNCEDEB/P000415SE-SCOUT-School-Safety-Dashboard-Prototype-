@incidents
Feature: Incidents Page

  Scenario: School Admin sees only their school's incidents
    Given I am logged in as "School Admin"
    When I navigate to "/incidents"
    Then I see only incidents belonging to my school
    And I do not see a school filter dropdown

  Scenario: Staff can access the Incidents page and sees only their own incidents
    Given I am logged in as "Staff"
    When I navigate to "/incidents"
    Then I only see incidents I triggered or am assigned to

  Scenario: Incident list rows show correct fields and status badge colours
    Given I am logged in as "School Admin"
    And at least one incident exists in the system
    When I view the Incidents page
    Then each row shows a type icon, title, location, timestamp, priority badge, and status badge
    And triggered incidents have a red status badge
    And acknowledged incidents have a blue status badge
    And in-progress incidents have a purple status badge
    And resolved incidents have a green status badge

  Scenario: Filter by status Acknowledged works
    Given I am logged in as "School Admin"
    And at least one acknowledged incident exists
    When I select "Acknowledged" from the Status filter
    Then I see only incidents with status "acknowledged"

  Scenario: Filter by priority Critical works
    Given I am logged in as "School Admin"
    And at least one critical incident exists
    When I select "Critical" from the Priority filter
    Then I see only incidents with priority "critical"

  Scenario: Search by keyword filters the incident list
    Given I am logged in as "School Admin"
    And an incident with a known title exists
    When I type part of that title into the search field
    Then I see only matching incidents in the list

  Scenario: Clicking an incident row navigates to the detail page
    Given I am logged in as "School Admin"
    And the Incidents list is loaded
    When I click any incident row
    Then I am navigated to "/incidents/:id" for that incident

  Scenario: Incident Detail page shows all required fields
    Given I am logged in as "School Admin"
    When I open an existing incident
    Then I see the title, type, priority, status, location, timestamp, reporter name, school name, and description
    And I see notification delivery statuses per recipient

  Scenario: Incident list is sorted newest-first
    Given I am logged in as "School Admin"
    And multiple incidents exist with different timestamps
    When I view the Incidents page
    Then the most recently created incident appears at the top of the list

  Scenario: School Admin sees only their own school's incidents
    Given I am logged in as "School Admin"
    And incidents from multiple schools exist
    When I view the Incidents page
    Then I only see incidents where schoolId matches my school

  Scenario: Staff sees only their own submitted or assigned incidents on the Incidents page
    Given I am logged in as "Staff"
    And both staff-submitted and unrelated incidents exist
    When I view the Incidents page
    Then I only see incidents I triggered or am assigned to
