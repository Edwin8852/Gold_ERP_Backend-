/**
 * GoldRate Model — Canonical source of truth for all gold/silver rates.
 *
 * Fields:
 *   - gold22k      : Market rate per gram for 22K gold (INR)
 *   - gold24k      : Market rate per gram for 24K gold (INR)
 *   - silverRate   : Market rate per gram for silver  (INR)
 *   - rateDate     : Date for which this record is valid (DATEONLY, unique)
 *   - source       : Origin of rate (e.g. "livechennai.com", "BankBazaar", "DB Fallback")
 *   - fetchedAt    : Exact IST timestamp when data was fetched
 *
 * Legacy aliases kept for backward-compat with loan calculations:
 *   - gold22KRate  : virtual getter → gold22k
 *   - gold24KRate  : virtual getter → gold24k
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
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Chennai',
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
    hooks: {
      beforeValidate: (instance) => {
        if (instance.city && instance.city !== 'Chennai') {
          throw new Error('City must be Chennai');
        }
      }
    }
  });

  return GoldRate;
};
