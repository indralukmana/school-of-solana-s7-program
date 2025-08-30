/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/plan_vault.json`.
 */
export type PlanVault = {
  "address": "24L8vhZLcquCPfTuh3HMSVA4FFicEuMTzKunGrvxwFXc",
  "metadata": {
    "name": "planVault",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "closeVault",
      "discriminator": [
        141,
        103,
        17,
        126,
        72,
        75,
        29,
        29
      ],
      "accounts": [
        {
          "name": "vaultAccount",
          "writable": true,
          "relations": [
            "plan"
          ]
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true,
          "relations": [
            "vaultAccount"
          ]
        },
        {
          "name": "plan",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "deposit",
      "discriminator": [
        242,
        35,
        198,
        137,
        82,
        225,
        242,
        182
      ],
      "accounts": [
        {
          "name": "vaultAccount",
          "writable": true
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true,
          "relations": [
            "vaultAccount"
          ]
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initializeVault",
      "discriminator": [
        48,
        191,
        163,
        44,
        71,
        129,
        63,
        164
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "vaultAccount",
          "writable": true
        },
        {
          "name": "plan",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  97,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "vaultAccount"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "planTitle",
          "type": "string"
        }
      ]
    },
    {
      "name": "submitPlan",
      "discriminator": [
        136,
        185,
        140,
        2,
        95,
        178,
        77,
        2
      ],
      "accounts": [
        {
          "name": "vaultAccount",
          "writable": true,
          "relations": [
            "plan"
          ]
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true,
          "relations": [
            "vaultAccount"
          ]
        },
        {
          "name": "plan",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": {
              "name": "planArgs"
            }
          }
        }
      ]
    },
    {
      "name": "withdraw",
      "discriminator": [
        183,
        18,
        70,
        156,
        148,
        109,
        161,
        34
      ],
      "accounts": [
        {
          "name": "vaultAccount",
          "writable": true
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true,
          "relations": [
            "vaultAccount"
          ]
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "plan",
      "discriminator": [
        161,
        231,
        251,
        119,
        2,
        12,
        162,
        2
      ]
    },
    {
      "name": "vaultAccount",
      "discriminator": [
        230,
        251,
        241,
        83,
        139,
        202,
        93,
        28
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "titleTooShort",
      "msg": "Title must be at least 3 characters"
    },
    {
      "code": 6001,
      "name": "titleTooLong",
      "msg": "Title must not exceed 200 characters"
    },
    {
      "code": 6002,
      "name": "insufficientFunds",
      "msg": "Insufficient funds"
    },
    {
      "code": 6003,
      "name": "transferFailed",
      "msg": "Failed to transfer tokens"
    },
    {
      "code": 6004,
      "name": "mustTransferMoreThanZero",
      "msg": "Must transfer more than 0"
    },
    {
      "code": 6005,
      "name": "vaultNotLocked",
      "msg": "Vault is not locked"
    },
    {
      "code": 6006,
      "name": "vaultLocked",
      "msg": "Vault is locked"
    },
    {
      "code": 6007,
      "name": "insufficientVaultFunds",
      "msg": "Vault funds must be greater than 0"
    },
    {
      "code": 6008,
      "name": "tooLong",
      "msg": "Input string exceeds max length"
    }
  ],
  "types": [
    {
      "name": "plan",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vaultAccount",
            "type": "pubkey"
          },
          {
            "name": "planTitle",
            "type": "string"
          },
          {
            "name": "tradingPlatform",
            "type": "string"
          },
          {
            "name": "riskLevel",
            "type": "string"
          },
          {
            "name": "ticker",
            "type": "string"
          },
          {
            "name": "investmentAmount",
            "type": "u64"
          },
          {
            "name": "stopLossBps",
            "type": "u64"
          },
          {
            "name": "takeProfitBps",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "planArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "tradingPlatform",
            "type": "string"
          },
          {
            "name": "riskLevel",
            "type": "string"
          },
          {
            "name": "ticker",
            "type": "string"
          },
          {
            "name": "investmentAmount",
            "type": "u64"
          },
          {
            "name": "stopLossBps",
            "type": "u64"
          },
          {
            "name": "takeProfitBps",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "vaultAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "vaultStatus"
              }
            }
          },
          {
            "name": "tokenVault",
            "type": "pubkey"
          },
          {
            "name": "planTitleHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "planTitle",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "vaultStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "locked"
          },
          {
            "name": "unlocked"
          }
        ]
      }
    }
  ],
  "constants": [
    {
      "name": "vaultSeed",
      "type": "string",
      "value": "\"vault\""
    }
  ]
};
