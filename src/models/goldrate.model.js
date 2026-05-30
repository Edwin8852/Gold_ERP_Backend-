/**
 * GoldRate Model — Canonical source of truth for all gold/silver rates.
 *
 * CITY POLICY: city must ALWAYS be 'Chennai'.
 * Any insert or update with a different city is rejected at the model level.
 *
 * Fields:
 *   - city        : Must always be 'Chennai'
 *   - gold22k     : Market rate per gram for 22K gold (INR) — Chennai rate
 *   - gold24k     : Market rate per gram for 24K gold (INR) — Chennai rate
 *   - silverRate  : Market rate per gram for silver  (INR) — Chennai rate
 *   - rateDate    : Date for which this record is valid (DATEONLY, unique)
 *   - source      : Origin of rate (e.g. 'Chennai Market Rates')
 *   - fetchedAt   : Exact IST timestamp when data was fetched
 *
 * Legacy aliases kept for backward-compat with loan calculations:
 *   - gold22KRate : virtual getter → gold22k
 *   - gold24KRate : virtual getter → gold24k
 */
module.exports = (sequelize, DataTypes) => {
  const GoldRate = sequelize.define('GoldRate', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    // ── Canonical fields (snake_case-style camelCase) ──────────────────────
    gold18k: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    gold22k: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true, // nullable during migration; will be populated by service
    },
    gold24k: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    silverRate: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    city: {
      type:         DataTypes.STRING,
      allowNull:    false,
      defaultValue: 'Chennai',
      validate: {
        isChennaiOnly(value) {
          if (value !== 'Chennai') {
            throw new Error('Only Chennai market rates are allowed');
          }
        },
      },
    },

    // ── Unique date field (one record per day) ──────────────────────────────
    rateDate: {
      type: DataTypes.DATEONLY, // stored as 'YYYY-MM-DD'
      allowNull: false,
      defaultValue: DataTypes.NOW,
      unique: true,             // prevents duplicate entries for same calendar day
    },

    // ── Data provenance ────────────────────────────────────────────────────
    source: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: 'Unknown',
    },
    fetchedAt: {
      type: DataTypes.DATE, // full timestamp with TZ
      allowNull: true,
    },

    // ── Legacy fields (kept for loan valuation backward-compat) ───────────
    gold22KRate: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    gold24KRate: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
      defaultValue: 'ACTIVE',
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  }, {
    timestamps: true,
    tableName: 'gold_rates',

    // Virtual getters so legacy code using gold22KRate / gold24KRate still works
    getterMethods: {
      gold22KRate() {
        return this.getDataValue('gold22KRate') || this.getDataValue('gold22k');
      },
      gold24KRate() {
        return this.getDataValue('gold24KRate') || this.getDataValue('gold24k');
      },
    },
    hooks: {
      beforeValidate: (instance) => {
        // Enforce Chennai-only policy at model level
        if (instance.city && instance.city !== 'Chennai') {
          throw new Error('Only Chennai market rates are allowed');
        }
        // Auto-correct null/undefined city to Chennai
        if (!instance.city) instance.city = 'Chennai';
        // Ensure source always shows Chennai Market Rates
        if (!instance.source || instance.source === 'Unknown') {
          instance.source = 'Chennai Market Rates';
        }
      },
      beforeCreate: (instance) => {
        if (instance.city !== 'Chennai') {
          throw new Error('Only Chennai market rates are allowed');
        }
      },
      beforeUpdate: (instance) => {
        if (instance.city !== 'Chennai') {
          throw new Error('Only Chennai market rates are allowed');
        }
      },
    }
  });

  return GoldRate;
};
