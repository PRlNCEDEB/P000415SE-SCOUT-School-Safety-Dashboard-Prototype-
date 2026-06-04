@auth
Feature: Authentication

  @SCRUM-T1
  Scenario: Company Admin logs in with valid credentials
    Given I am on the login page
    When I enter email "admin@scout.edu" and password "password123"
    And I click Sign in
    Then I am redirected to "/setup"
    And I see the role badge "Company Admin" in red

  @SCRUM-T2
  Scenario: School Admin logs in with valid credentials
    Given I am on the login page
    When I enter email "schooladmin@school.edu" and password "password123"
    And I click Sign in
    Then I am redirected to the dashboard
    And I see the role badge "School Admin" in purple
    And I do not see shortcut cards

  @SCRUM-T3
  Scenario: Staff logs in with valid credentials
    Given I am on the login page
    When I enter email "staff@school.edu" and password "password123"
    And I click Sign in
    Then I am redirected to the dashboard
    And I see the role badge "Staff" in blue
    And I see the My Activity section

  @SCRUM-T7
  Scenario: Login fails with invalid credentials
    Given I am on the login page
    When I enter email "wrong@test.com" and password "wrongpass"
    And I click Sign in
    Then I see the error message "Invalid email or password."
    And I remain on the login page

  @SCRUM-T8
  Scenario: Login is blocked when fields are empty
    Given I am on the login page
    When I leave the email and password fields empty
    And I click Sign in
    Then the form is not submitted
    And I remain on the login page

  @SCRUM-T9
  Scenario: Self-registration notice is visible on the login page
    Given I am on the login page
    Then I see the notice "Self-registration is not permitted. Contact your Safety Manager to request access."
    And there is no sign-up or register link on the page

  @SCRUM-T10
  Scenario: Demo login button auto-fills and signs in as Company Admin
    Given I am on the login page
    When I click the demo login button for "Company Admin"
    Then the email field is filled with "admin@scout.edu"
    And I am redirected to "/setup"

  @SCRUM-T11
  Scenario: Authenticated user is redirected away from the login page
    Given I am logged in as "School Admin"
    When I navigate to "/login"
    Then I am redirected to the dashboard

  @SCRUM-T12
  Scenario: Unauthenticated user is redirected to the login page
    Given I am not logged in
    When I navigate to "/dashboard"
    Then I am redirected to "/login"

  @SCRUM-T13
  Scenario: Logout clears the session
    Given I am logged in as "Company Admin"
    When I click the logout control
    Then I am redirected to "/login"
    And navigating to "/dashboard" redirects me back to "/login"
