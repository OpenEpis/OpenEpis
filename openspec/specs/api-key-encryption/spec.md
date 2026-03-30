## ADDED Requirements

### Requirement: CryptoService for AES-256-GCM encryption

`@openepis/storage-pg` SHALL export a `CryptoService` class that encrypts and decrypts strings using AES-256-GCM.

The constructor SHALL accept a 32-byte encryption key (as a `Buffer`).

The service SHALL provide:

- `encrypt(plaintext: string): string` — returns `base64(iv):base64(authTag):base64(ciphertext)`
- `decrypt(encrypted: string): string` — parses the format above and returns the original plaintext

The IV SHALL be randomly generated (16 bytes) for each encryption operation.

#### Scenario: Round-trip encryption

- **WHEN** `encrypt("sk-abc123")` is called followed by `decrypt()` on the result
- **THEN** the original plaintext `"sk-abc123"` is returned

#### Scenario: Unique ciphertext per call

- **WHEN** `encrypt("same-key")` is called twice
- **THEN** the two encrypted values are different (due to random IV)

#### Scenario: Tampered ciphertext fails

- **WHEN** `decrypt()` is called with a modified ciphertext string
- **THEN** an error is thrown indicating decryption failure

#### Scenario: Invalid format fails

- **WHEN** `decrypt()` is called with a string that does not match the `base64:base64:base64` format
- **THEN** an error is thrown

### Requirement: Encryption key from environment

The `CryptoService` SHALL be initialized with a key derived from the `ENCRYPTION_KEY` environment variable.

`ENCRYPTION_KEY` SHALL be a 64-character hexadecimal string (representing 32 bytes).

#### Scenario: Valid encryption key

- **WHEN** `ENCRYPTION_KEY` is set to a valid 64-char hex string
- **THEN** `CryptoService` initializes successfully

#### Scenario: Missing encryption key

- **WHEN** `ENCRYPTION_KEY` is not set
- **THEN** the application SHALL throw a descriptive error at startup

#### Scenario: Invalid encryption key format

- **WHEN** `ENCRYPTION_KEY` is set but is not a valid 64-char hex string
- **THEN** the application SHALL throw a descriptive error at startup

### Requirement: Encrypt API keys on write

`PostgresLlmConfigStorage.create()` and `update()` SHALL encrypt the `api_key` value using `CryptoService` before storing it in the `api_key_encrypted` column.

If `api_key` is `null` or `undefined`, the `api_key_encrypted` column SHALL be set to `null` (no encryption of null values).

#### Scenario: Create with API key

- **WHEN** `create()` is called with `api_key: "sk-abc123"`
- **THEN** the `api_key_encrypted` column contains an AES-256-GCM encrypted value, not the plaintext

#### Scenario: Create without API key

- **WHEN** `create()` is called with `api_key: null`
- **THEN** the `api_key_encrypted` column is `null`

#### Scenario: Update API key

- **WHEN** `update()` is called with `api_key: "sk-new"`
- **THEN** the `api_key_encrypted` column is updated with a newly encrypted value

### Requirement: Decrypt API keys on read

`PostgresLlmConfigStorage.findById()` and `findByScope()` SHALL decrypt the `api_key_encrypted` value using `CryptoService` and return it as `api_key` in the `LlmConfig` entity.

If `api_key_encrypted` is `null`, the returned `api_key` SHALL be `null`.

#### Scenario: Read with encrypted API key

- **WHEN** `findById()` returns a row with a non-null `api_key_encrypted`
- **THEN** the returned `LlmConfig.api_key` contains the decrypted plaintext

#### Scenario: Read with null API key

- **WHEN** `findById()` returns a row with `api_key_encrypted = null`
- **THEN** the returned `LlmConfig.api_key` is `null`
