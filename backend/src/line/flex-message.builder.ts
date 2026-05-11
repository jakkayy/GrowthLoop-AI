export type PostEngagementItem = {
  index: number;
  imageUrl: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  recentComments: { author: string; text: string }[];
};

export function buildEngagementReportFlex(
  posts: PostEngagementItem[],
  total: number,
) {
  const bubbles = posts.map((post) => buildEngagementBubble(post, total));
  const contents =
    bubbles.length === 1
      ? bubbles[0]
      : { type: 'carousel', contents: bubbles };

  const shown = posts[posts.length - 1]?.index ?? posts.length;
  const from = posts[0]?.index ?? 1;
  const rangeLabel = total > posts.length ? ` (โพสต์ที่ ${from}–${shown})` : '';

  return {
    type: 'flex',
    altText: `📊 รายงาน Engagement ประจำวัน — ${total} โพสต์ทั้งหมด${rangeLabel}`,
    contents,
  };
}

function statBox(value: string, label: string, textColor: string, bgColor: string) {
  return {
    type: 'box',
    layout: 'vertical',
    flex: 1,
    backgroundColor: bgColor,
    cornerRadius: '10px',
    paddingAll: '10px',
    margin: 'xs',
    contents: [
      {
        type: 'text',
        text: value,
        size: 'xl',
        weight: 'bold',
        color: textColor,
        align: 'center',
      },
      {
        type: 'text',
        text: label,
        size: 'xxs',
        color: '#999999',
        align: 'center',
        margin: 'xs',
      },
    ],
  };
}

function buildEngagementBubble(post: PostEngagementItem, total: number) {
  const commentRows: any[] = post.recentComments.map((c) => ({
    type: 'box',
    layout: 'horizontal',
    margin: 'sm',
    spacing: 'sm',
    contents: [
      {
        type: 'box',
        layout: 'vertical',
        width: '3px',
        backgroundColor: '#6c63ff',
        cornerRadius: '4px',
        contents: [],
      },
      {
        type: 'box',
        layout: 'vertical',
        flex: 1,
        contents: [
          {
            type: 'text',
            text: c.author,
            size: 'xxs',
            weight: 'bold',
            color: '#444444',
          },
          {
            type: 'text',
            text: c.text,
            size: 'xxs',
            color: '#888888',
            wrap: true,
            margin: 'xs',
          },
        ],
      },
    ],
  }));

  const bodyContents: any[] = [
    {
      type: 'box',
      layout: 'horizontal',
      contents: [
        statBox(String(post.likesCount), 'Likes', '#e05c5c', '#fff5f5'),
        statBox(String(post.commentsCount), 'Comments', '#4a9eff', '#f0f7ff'),
        statBox(String(post.sharesCount), 'Shares', '#27ae60', '#f0fff5'),
      ],
    },
  ];

  if (post.recentComments.length > 0) {
    bodyContents.push(
      { type: 'separator', margin: 'lg', color: '#f0f0f0' },
      {
        type: 'text',
        text: 'ความคิดเห็นล่าสุด',
        size: 'xs',
        color: '#666666',
        weight: 'bold',
        margin: 'lg',
      },
      ...commentRows,
    );
  }

  return {
    type: 'bubble',
    size: 'mega',
    header: {
      type: 'box',
      layout: 'horizontal',
      backgroundColor: '#1a1a2e',
      paddingAll: '14px',
      contents: [
        {
          type: 'box',
          layout: 'vertical',
          flex: 1,
          contents: [
            {
              type: 'text',
              text: 'ENGAGEMENT REPORT',
              size: 'xxs',
              color: '#6c63ff',
              weight: 'bold',
            },
            {
              type: 'text',
              text: `โพสต์ที่ ${post.index} / ${total}`,
              size: 'sm',
              color: '#ffffff',
              weight: 'bold',
              margin: 'xs',
            },
          ],
        },
      ],
    },
    hero: {
      type: 'image',
      url: post.imageUrl,
      size: 'full',
      aspectRatio: '20:13',
      aspectMode: 'cover',
    },
    body: {
      type: 'box',
      layout: 'vertical',
      paddingAll: '14px',
      paddingTop: '16px',
      spacing: 'none',
      contents: bodyContents,
    },
  };
}

export function buildReviewFlex(input: {
  draftId: string;
  caption: string;
  imageUrl: string;
}) {
  return {
    type: 'flex',
    altText: 'Review generated content',
    contents: {
      type: 'bubble',
      hero: {
        type: 'image',
        url: input.imageUrl,
        size: 'full',
        aspectRatio: '1:1',
        aspectMode: 'cover',
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        contents: [
          {
            type: 'text',
            text: 'Generated Content',
            weight: 'bold',
            size: 'lg',
          },
          {
            type: 'text',
            text: input.caption,
            wrap: true,
            size: 'sm',
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'horizontal',
        spacing: 'sm',
        contents: [
          {
            type: 'button',
            style: 'primary',
            action: {
              type: 'postback',
              label: 'Approve',
              data: `action=approve&draftId=${input.draftId}`,
              displayText: 'Approve content',
            },
          },
          {
            type: 'button',
            style: 'secondary',
            action: {
              type: 'postback',
              label: 'Deny',
              data: `action=deny&draftId=${input.draftId}`,
              displayText: 'Deny content',
            },
          },
        ],
      },
    },
  };
}
