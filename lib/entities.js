import { apiFetch } from './api-client';

/**
 * Base Entity class with common CRUD operations
 */
class BaseEntity {
  constructor(resourcePath) {
    this.resourcePath = resourcePath;
  }

  async get(id) {
    return apiFetch(`${this.resourcePath}/${id}`);
  }

  async getAll() {
    return apiFetch(this.resourcePath);
  }

  async filter(filters = {}, sortBy = null, limit = null) {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      params.append(key, value);
    });
    
    if (sortBy) params.append('sortBy', sortBy);
    if (limit) params.append('limit', limit);
    
    const query = params.toString();
    const url = query ? `${this.resourcePath}?${query}` : this.resourcePath;
    
    return apiFetch(url);
  }

  async list(sortBy = null, limit = null) {
    return this.filter({}, sortBy, limit);
  }

  async create(data) {
    return apiFetch(this.resourcePath, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async bulkCreate(dataArray) {
    // For bulk creation, we'll create items one by one
    // Some APIs might have a dedicated bulk endpoint, but for now this works
    const results = [];
    for (const data of dataArray) {
      try {
        const result = await this.create(data);
        results.push(result);
      } catch (error) {
        console.error(`Failed to create item:`, error);
        // Continue with other items even if one fails
      }
    }
    return results;
  }

  async update(id, data) {
    return apiFetch(`${this.resourcePath}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(id) {
    return apiFetch(`${this.resourcePath}/${id}`, {
      method: 'DELETE',
    });
  }
}

/**
 * Analysis entity
 */
class AnalysisEntity extends BaseEntity {
  constructor() {
    super('/analysis');
  }

  async start(data) {
    return apiFetch(`${this.resourcePath}/start`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCrud(id) {
    return apiFetch(`${this.resourcePath}/crud/${id}`);
  }

  async updateCrud(id, data) {
    return apiFetch(`${this.resourcePath}/crud/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteCrud(id) {
    return apiFetch(`${this.resourcePath}/crud/${id}`, {
      method: 'DELETE',
    });
  }
}

/**
 * Recommendation entity
 */
class RecommendationEntity extends BaseEntity {
  constructor() {
    super('/recommendation');
  }
}

/**
 * User entity
 */
class UserEntity extends BaseEntity {
  constructor() {
    super('/user');
  }

  async me() {
    return apiFetch(`${this.resourcePath}/me`);
  }
}

/**
 * Article entity
 */
class ArticleEntity extends BaseEntity {
  constructor() {
    super('/article');
  }
}

/**
 * Generated Article entity
 */
class GeneratedArticleEntity extends BaseEntity {
  constructor() {
    super('/generated-article');
  }
}

/**
 * Writing Request entity
 */
class WritingRequestEntity extends BaseEntity {
  constructor() {
    super('/writing-request');
  }
}

// Export singleton instances
export const Analysis = new AnalysisEntity();
export const Recommendation = new RecommendationEntity();
export const User = new UserEntity();
export const Article = new ArticleEntity();
export const GeneratedArticle = new GeneratedArticleEntity();
export const WritingRequest = new WritingRequestEntity();

