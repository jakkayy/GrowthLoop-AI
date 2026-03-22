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
