import logging

import redis

from app.core.config import settings

logger = logging.getLogger(__name__)
redis_client = redis.Redis.from_url(settings.redis_url, decode_responses=True)


def consume_rate_limit(identity: str) -> bool:
    key = f"rate-limit:{identity}"
    try:
        current = redis_client.incr(key)
        if current == 1:
            redis_client.expire(key, 60)
        return current <= settings.rate_limit_per_minute
    except redis.RedisError:
        # Redis 故障时不阻断核心 API；生产环境应通过监控及时恢复限流能力。
        logger.exception("Rate-limit backend unavailable")
        return True