@analytics
Feature: Analytics

  @SCRUM-T58
  Scenario: School Admin can access the Analytics page
    Given I am logged in as "School Admin"
    When I navigate to "/analytics"
    Then the Analytics page loads
    And I see summary cards and charts

  @SCRUM-T59
  Scenario: Company Admin is redirected from the Analytics page to Setup
    Given I am logged in as "Company Admin"
    When I navigate to "/analytics"
    Then I am redirected to "/setup"

  @SCRUM-T60
  Scenario: Staff is redirected from the Analytics page
    Given I am logged in as "Staff"
    When I navigate to "/analytics"
    Then I am redirected to "/dashboard"

  @SCRUM-T61
  Scenario: School Admin sees 3 summary cards on Analytics
    Given I am logged in as "School Admin"
    When I view the Analytics page
    Then I see 3 summary cards: "Total Incidents", "Resolved", and "This Week"
    And each card has a numeric value and a subtitle

  @SCRUM-T62
  Scenario: School scope banner is visible on Analytics
    Given I am logged in as "School Admin"
    When I view the Analytics page
    Then I see a school scope banner with the school name

  @SCRUM-T63
  Scenario: Incidents by Type bar chart renders
    Given I am logged in as "School Admin"
    And seeded incident data exists across multiple types
    When I view the Analytics page
    Then I see an "Incidents by Type" bar chart with counts grouped by type

  @SCRUM-T64
  Scenario: Status Breakdown pie chart renders
    Given I am logged in as "School Admin"
    And incidents exist across multiple statuses
    When I view the Analytics page
    Then I see a "Status Breakdown" donut chart with a legend

  @SCRUM-T65
  Scenario: Incidents by Location donut chart renders
    Given I am logged in as "School Admin"
    And incidents exist across multiple locations
    When I view the Analytics page
    Then I see an "Incidents by Location" donut chart showing top 5 locations and Others

  @SCRUM-T66
  Scenario: Incidents by Priority and Failed Alerts charts render side by side
    Given I am logged in as "School Admin"
    When I view the Analytics page
    Then I see an "Incidents by Priority" chart
    And I see a "Failed Alerts" chart

  @SCRUM-T67
  Scenario: Incident Trends section renders with range selector
    Given I am logged in as "School Admin"
    And incidents exist within the current week
    When I view the Analytics page
    Then I see an "Incidents Over Time" chart in the Incident Trends section
    And I see an "Incidents by Day of Week" chart
    And I see an "Incidents by Hour of Day" chart

  @SCRUM-T68
  Scenario: Analytics Refresh button reloads data
    Given I am logged in as "School Admin"
    And I am on the Analytics page
    When I click the Refresh button
    Then the data is re-fetched and updated values are displayed

  @SCRUM-T69
  Scenario: Unacknowledged count in Status Breakdown reflects only non-archived incidents
    Given an incident has been created and then acknowledged
    And I am logged in as "School Admin"
    When I view the Analytics page
    Then the Unacknowledged Alerts count reflects only incidents still in triggered status
