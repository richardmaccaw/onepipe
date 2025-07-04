export function validateConfig(config) {
  const errors = [];

  // BigQuery validation
  if (!config.projectId || config.projectId.trim() === '') {
    errors.push('BigQuery Project ID is required');
  }

  if (!config.datasetId || config.datasetId.trim() === '') {
    errors.push('BigQuery Dataset ID is required');
  }

  // Service Account Key validation
  if (!config.serviceAccountKey) {
    errors.push('BigQuery Service Account Key is required');
  } else {
    try {
      const key = JSON.parse(config.serviceAccountKey);
      if (!key.type || key.type !== 'service_account') {
        errors.push('Invalid service account key: must be of type "service_account"');
      }
      if (!key.private_key) {
        errors.push('Invalid service account key: missing private_key');
      }
      if (!key.client_email) {
        errors.push('Invalid service account key: missing client_email');
      }
      if (!key.project_id) {
        errors.push('Invalid service account key: missing project_id');
      }
    } catch (e) {
      errors.push('Invalid service account key: must be valid JSON');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}