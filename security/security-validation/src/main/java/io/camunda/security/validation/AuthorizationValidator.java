/*
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH under
 * one or more contributor license agreements. See the NOTICE file distributed
 * with this work for additional information regarding copyright ownership.
 * Licensed under the Camunda License 1.0. You may not use this file
 * except in compliance with the Camunda License 1.0.
 */
package io.camunda.security.validation;

import static io.camunda.security.validation.ErrorMessages.ERROR_MESSAGE_EMPTY_ATTRIBUTE;

import io.camunda.zeebe.protocol.impl.record.value.authorization.AuthorizationRecord;
import io.camunda.zeebe.protocol.record.value.AuthorizationScope;
import java.util.List;
import java.util.regex.Pattern;

public class AuthorizationValidator {

  private final Pattern idPattern;

  public AuthorizationValidator(final Pattern idPattern) {
    this.idPattern = idPattern;
  }

  public void validate(final AuthorizationRecord request, final List<String> violations) {
    // owner validation
    IdentifierValidator.validateId(request.getOwnerId(), "ownerId", violations, idPattern);
    if (request.getOwnerType() == null) {
      violations.add(ERROR_MESSAGE_EMPTY_ATTRIBUTE.formatted("ownerType"));
    }

    // resource validation
    IdentifierValidator.validateId(
        request.getResourceId(),
        "resourceId",
        violations,
        idPattern,
        AuthorizationScope.WILDCARD_CHAR::equals);
    if (request.getResourceType() == null) {
      violations.add(ERROR_MESSAGE_EMPTY_ATTRIBUTE.formatted("resourceType"));
    }

    // permissions validation
    if (request.getPermissionTypes() == null || request.getPermissionTypes().isEmpty()) {
      violations.add(ERROR_MESSAGE_EMPTY_ATTRIBUTE.formatted("permissions"));
    }
  }
}
