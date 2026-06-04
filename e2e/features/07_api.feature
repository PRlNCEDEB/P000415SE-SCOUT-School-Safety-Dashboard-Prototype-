@api
Feature: API

  @SCRUM-T52
  Scenario: API health check returns OK
    When I send a GET request to "/api/health"
    Then the response status is 200
    And the response body contains "status" with value "ok"
    And the response body contains a "timestamp" field

  @SCRUM-T53
  Scenario: API returns 404 for unknown routes
    When I send a GET request to "/api/unknown-route"
    Then the response status is 404
    And the response body contains "not found"

  @SCRUM-T54
  Scenario: GET /api/incidents returns 401 without a token
    Given no Authorization header is provided
    When I send a GET request to "/api/incidents"
    Then the response status is 401
    And the response body contains "No token provided."

  @SCRUM-T55
  Scenario: GET /api/auth/role returns role and schoolId for authenticated user
    Given I have a valid Firebase ID token for any demo account
    When I send a GET request to "/api/auth/role" with a Bearer token
    Then the response status is 200
    And the response body contains role, schoolId, and name fields

  @SCRUM-T56
  Scenario: POST /api/incidents creates an incident with correct fields
    Given I have a valid Firebase ID token
    When I send a POST request to "/api/incidents" with type "fire", priority "high", title "Test Fire", location "Block B", description "Drill"
    Then the response status is 201
    And the response contains id, type "fire", priority "high", title "Test Fire", location "Block B", status "triggered", createdAt, updatedAt, and triggeredByName

  @SCRUM-T57
  Scenario: Staff token cannot update another user's incident via API
    Given I have a valid Staff Firebase ID token
    And an incident exists that was not created by this staff user
    When I send a PATCH request to "/api/incidents/:id/status" with the Staff token
    Then the response status is 403
    And the response body contains "You do not have permission to update this incident."
