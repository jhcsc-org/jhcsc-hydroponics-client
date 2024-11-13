import { usePublish } from "../hooks/usePublish";

interface PublishContent {
  [key: string | symbol]: unknown;
}

interface MessageContent extends PublishContent {
  msg: string;
}

const PublishComponent: React.FC = () => {
  const message: MessageContent = { msg: 'Hello to all subscribers!' };

  // Publish to a single topic with a specific provider
  const publishWithProvider = usePublish<MessageContent>(
    "myTopic1",
    message,
    { provider: "AWSIoTProvider" },
  );

  // Publish to multiple topics
  const publishToMultipleTopics = usePublish<MessageContent>(
    ["myTopic1", "myTopic2"],
    message,
  );

  return (
    <div>
      <button type="button" onClick={publishWithProvider}>Publish with Provider</button>
      <button type="button" onClick={publishToMultipleTopics}>Publish to Multiple Topics</button>
    </div>
  );
};

export default PublishComponent;