import { Card, Statistic, Tag, Button, Space } from "antd";
import { getLinkedInMetrics, linkedinAuthUrl } from "../services/linkedinService";
import { useState, useEffect } from "react";

export default function LinkedInDashboard({ jwt }: { jwt: string }) {
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    if (!jwt) return;
    getLinkedInMetrics(jwt).then(setMetrics);
  }, [jwt]);

  return (
    <Space wrap size="large">
      {/* Followers */}
      <Card title="LinkedIn Followers">
        {metrics?.followers?.available ? (
          <Statistic value={metrics.followers.value} />
        ) : (
          <Button href={linkedinAuthUrl}>Connect LinkedIn</Button>
        )}
      </Card>

      {/* Total Connections */}
      <Card title="Total Connections">
        {metrics?.connections?.available ? (
          <Statistic value={metrics.connections.value} />
        ) : (
          <Tag color="default">Not Available</Tag>
        )}
      </Card>

      {/* Profile Views */}
      <Card title="Profile Views (90 days)">
        <Tag color="default">Not supported by LinkedIn API</Tag>
      </Card>
    </Space>
  );
}

