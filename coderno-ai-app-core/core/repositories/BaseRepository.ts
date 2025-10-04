import { DatabaseConfig, TableConfig } from '../types';

export abstract class BaseRepository<T = any> {
  protected config: DatabaseConfig;
  protected tableName: string;
  protected tableConfig: TableConfig;

  constructor(config: DatabaseConfig, tableName: string) {
    this.config = config;
    this.tableName = tableName;
    this.tableConfig = this.getTableConfig(tableName);
  }

  /**
   * Create new record
   */
  async create(data: Partial<T>): Promise<T> {
    const query = this.buildInsertQuery(data);
    const result = await this.executeQuery(query, Object.values(data));
    return result[0];
  }

  /**
   * Find record by ID
   */
  async findById(id: string): Promise<T | null> {
    const query = `SELECT * FROM ${this.tableName} WHERE id = $1`;
    const result = await this.executeQuery(query, [id]);
    return result[0] || null;
  }

  /**
   * Find multiple records with pagination
   */
  async findMany(options: {
    page: number;
    limit: number;
    filters: Record<string, any>;
    orderBy?: string;
    orderDirection?: 'ASC' | 'DESC';
  }): Promise<{ data: T[]; total: number }> {
    const { page, limit, filters, orderBy, orderDirection = 'ASC' } = options;
    const offset = (page - 1) * limit;

    // Build WHERE clause
    const whereClause = this.buildWhereClause(filters);
    const whereParams = Object.values(filters);

    // Count total records
    const countQuery = `SELECT COUNT(*) as total FROM ${this.tableName} ${whereClause}`;
    const countResult = await this.executeQuery(countQuery, whereParams);
    const total = parseInt(countResult[0].total);

    // Get paginated data
    const orderClause = orderBy ? `ORDER BY ${orderBy} ${orderDirection}` : '';
    const dataQuery = `
      SELECT * FROM ${this.tableName} 
      ${whereClause} 
      ${orderClause} 
      LIMIT $${whereParams.length + 1} OFFSET $${whereParams.length + 2}
    `;
    
    const dataResult = await this.executeQuery(dataQuery, [...whereParams, limit, offset]);
    
    return { data: dataResult, total };
  }

  /**
   * Find records by criteria
   */
  async findBy(filters: Record<string, any>): Promise<T[]> {
    const whereClause = this.buildWhereClause(filters);
    const query = `SELECT * FROM ${this.tableName} ${whereClause}`;
    return await this.executeQuery(query, Object.values(filters));
  }

  /**
   * Update record
   */
  async update(id: string, data: Partial<T>): Promise<T> {
    const setClause = this.buildSetClause(data);
    const values = Object.values(data);
    const query = `UPDATE ${this.tableName} SET ${setClause} WHERE id = $${values.length + 1} RETURNING *`;
    
    const result = await this.executeQuery(query, [...values, id]);
    return result[0];
  }

  /**
   * Delete record
   */
  async delete(id: string): Promise<void> {
    const query = `DELETE FROM ${this.tableName} WHERE id = $1`;
    await this.executeQuery(query, [id]);
  }

  /**
   * Count records
   */
  async count(filters: Record<string, any> = {}): Promise<number> {
    const whereClause = this.buildWhereClause(filters);
    const query = `SELECT COUNT(*) as total FROM ${this.tableName} ${whereClause}`;
    const result = await this.executeQuery(query, Object.values(filters));
    return parseInt(result[0].total);
  }

  /**
   * Execute custom query
   */
  async executeQuery(query: string, params: any[] = []): Promise<any[]> {
    // This should be implemented by concrete repository
    throw new Error('executeQuery must be implemented by concrete repository');
  }

  /**
   * Get table configuration
   */
  protected getTableConfig(tableName: string): TableConfig {
    const table = this.config.tables.find(t => t.name === tableName);
    if (!table) {
      throw new Error(`Table ${tableName} not found in configuration`);
    }
    return table;
  }

  /**
   * Build INSERT query
   */
  protected buildInsertQuery(data: Partial<T>): string {
    const fields = Object.keys(data);
    const placeholders = fields.map((_, index) => `$${index + 1}`);
    
    return `
      INSERT INTO ${this.tableName} (${fields.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `;
  }

  /**
   * Build WHERE clause
   */
  protected buildWhereClause(filters: Record<string, any>): string {
    if (Object.keys(filters).length === 0) {
      return '';
    }

    const conditions = Object.keys(filters).map((key, index) => 
      `${key} = $${index + 1}`
    );

    return `WHERE ${conditions.join(' AND ')}`;
  }

  /**
   * Build SET clause for UPDATE
   */
  protected buildSetClause(data: Partial<T>): string {
    const fields = Object.keys(data);
    return fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
  }

  /**
   * Validate data against table schema
   */
  protected validateData(data: Partial<T>): void {
    const requiredFields = this.tableConfig.fields.filter(f => f.required);
    
    requiredFields.forEach(field => {
      if (!(field.name in data) || data[field.name as keyof T] === undefined) {
        throw new Error(`Required field ${field.name} is missing`);
      }
    });

    // Validate field types
    Object.entries(data).forEach(([key, value]) => {
      const fieldConfig = this.tableConfig.fields.find(f => f.name === key);
      if (fieldConfig) {
        this.validateFieldType(key, value, fieldConfig.type);
      }
    });
  }

  /**
   * Validate field type
   */
  protected validateFieldType(fieldName: string, value: any, expectedType: string): void {
    switch (expectedType) {
      case 'string':
        if (typeof value !== 'string') {
          throw new Error(`Field ${fieldName} must be a string`);
        }
        break;
      case 'number':
        if (typeof value !== 'number') {
          throw new Error(`Field ${fieldName} must be a number`);
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          throw new Error(`Field ${fieldName} must be a boolean`);
        }
        break;
      case 'json':
        if (typeof value !== 'object') {
          throw new Error(`Field ${fieldName} must be an object`);
        }
        break;
      case 'date':
        if (!(value instanceof Date) && typeof value !== 'string') {
          throw new Error(`Field ${fieldName} must be a date`);
        }
        break;
      case 'uuid':
        if (typeof value !== 'string' || !this.isValidUUID(value)) {
          throw new Error(`Field ${fieldName} must be a valid UUID`);
        }
        break;
    }
  }

  /**
   * Check if string is valid UUID
   */
  protected isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}
