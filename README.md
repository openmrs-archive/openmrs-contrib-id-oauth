OAuth for OpenMRS ID
========

Provides an OAuth 2.0 authorization framework for the [OpenMRS ID Dashboard][1].

Installation:



    git clone https://github.com/elliottwilliams/openmrs-contrib-id-oauth.git
    # Within app/user-modules directory of OpenMRS ID

    cd openmrs-contrib-id-oauth

    npm install
    # Install module dependencies

    vim ../../conf.js
    # Add "openmrs-contrib-id-oauth" to list of user-modules


API
---

### /oauth/authorize

OAuth Authorization Request Endpoint

Send a user (a UA or browser) to this endpoint to begin the authorization flow.

### /oauth/token

OAuth Access Token Request Endpoint

Called by the client to exchange an authorization code for an access token.

### /oauth/userinfo

OpenMRS ID Profile Endpoint

Make an authenticated request to this resource to get the authorized user's profile data.


[1]: https://github.com/openmrs/openmrs-contrib-id
