export async function queryD1(query, params = []) {
    const result = await DATABASE.prepare(query).bind(...params).all();
    return result.results;
  }
  