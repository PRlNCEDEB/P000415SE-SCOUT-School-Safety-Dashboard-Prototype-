@dashboard
Feature: Dashboard

  @SCRUM-T22
  Scenario: Company Admin is redirected to Setup when navigating to the dashboard
    Given I am logged in as "Company Admin"
    When I view the dashboard
    Then I am redirected to "/setup"

  @SCRUM-T23
  Scenario: School Admin dashboard shows system status view
    Given I am logged in as "School Admin"
    When I view the dashboard
    Then I see the school admin status component with plain-English labels

  @SCRUM-T24
  Scenario: Staff dashboard shows My Activity incident list
    Given I am logged in as "Staff"
    When I view the dashboard
    Then I see the My Activity section
    And I do not see shortcut cards

  @SCRUM-T25
  Scenario: Clicking an unacknowledged alert navigates to incident detail
    Given I am logged in as "School Admin"
    And at least one triggered incident exists
    When I click on an unacknowledged alert row in the dashboard
    Then I am navigated to the incident detail page for that alert
