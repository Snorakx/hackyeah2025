import { APIResponse, PaginatedResponse } from '../types';

export abstract class BaseService<T = any> {
  protected repository: any;

  constructor(repository: any) {
    this.repository = repository;
  }

  /**
   * Create new record
   */
  async create(data: Partial<T>): Promise<APIResponse<T>> {
    try {
      const result = await this.repository.create(data);
      return {
        success: true,
        data: result
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get record by ID
   */
  async getById(id: string): Promise<APIResponse<T>> {
    try {
      const result = await this.repository.findById(id);
      if (!result) {
        return {
          success: false,
          error: 'Record not found'
        };
      }
      return {
        success: true,
        data: result
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get all records with pagination
   */
  async getAll(
    page: number = 1,
    limit: number = 10,
    filters: Record<string, any> = {}
  ): Promise<PaginatedResponse<T>> {
    try {
      const { data, total } = await this.repository.findMany({
        page,
        limit,
        filters
      });

      return {
        success: true,
        data,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0
        }
      };
    }
  }

  /**
   * Update record
   */
  async update(id: string, data: Partial<T>): Promise<APIResponse<T>> {
    try {
      const result = await this.repository.update(id, data);
      return {
        success: true,
        data: result
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Delete record
   */
  async delete(id: string): Promise<APIResponse<boolean>> {
    try {
      await this.repository.delete(id);
      return {
        success: true,
        data: true
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Find records by criteria
   */
  async findBy(filters: Record<string, any>): Promise<APIResponse<T[]>> {
    try {
      const results = await this.repository.findBy(filters);
      return {
        success: true,
        data: results
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Count records
   */
  async count(filters: Record<string, any> = {}): Promise<APIResponse<number>> {
    try {
      const count = await this.repository.count(filters);
      return {
        success: true,
        data: count
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Execute custom query
   */
  async executeQuery(query: string, params: any[] = []): Promise<APIResponse<any>> {
    try {
      const result = await this.repository.executeQuery(query, params);
      return {
        success: true,
        data: result
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}
