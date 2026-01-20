import { CreatePostSchema } from "@acme/db/schema";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { AuthShowcase } from "@/components/auth-showcase";
import { useTRPC } from "@/lib/trpc";

import type { RouterOutputs } from "@acme/api";

export default function HomeScreen() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const createPost = useMutation(
    trpc.post.create.mutationOptions({
      onSuccess: () => {
        form.reset();
        void queryClient.invalidateQueries(trpc.post.pathFilter());
      },
      onError: (err) => {
        Alert.alert(
          "Error",
          err.data?.code === "UNAUTHORIZED"
            ? "You must be logged in to post"
            : "Failed to create post",
        );
      },
    }),
  );

  const form = useForm({
    defaultValues: { title: "", content: "" },
    validators: { onSubmit: CreatePostSchema },
    onSubmit: ({ value }) => createPost.mutate(value),
  });

  const { data: posts, isPending } = useQuery(trpc.post.all.queryOptions());

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="container mx-auto max-w-2xl gap-6 px-4 py-12">
        <Text className="text-foreground text-center text-3xl font-bold">
          Create T3 Turbo
        </Text>
        <AuthShowcase />

        <View>
          <Text className="text-foreground mb-1 text-sm font-medium">
            Title
          </Text>
          <form.Field name="title">
            {(field) => (
              <TextInput
                className="border-border bg-background text-foreground rounded-md border px-3 py-2"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChangeText={field.handleChange}
                placeholder="Title"
                editable={!createPost.isPending}
              />
            )}
          </form.Field>
        </View>
        <View>
          <Text className="text-foreground mb-1 text-sm font-medium">
            Content
          </Text>
          <form.Field name="content">
            {(field) => (
              <TextInput
                className="border-border bg-background text-foreground rounded-md border px-3 py-2"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChangeText={field.handleChange}
                placeholder="Content"
                multiline
                editable={!createPost.isPending}
              />
            )}
          </form.Field>
        </View>
        <Pressable
          className="bg-primary items-center rounded-lg py-3"
          onPress={() => form.handleSubmit()}
          disabled={createPost.isPending}
        >
          <Text className="text-primary-foreground font-semibold">
            {createPost.isPending ? "Creating…" : "Create"}
          </Text>
        </Pressable>

        <View className="gap-4">
          {isPending ? (
            <ActivityIndicator />
          ) : !posts || posts.length === 0 ? (
            <Text className="text-muted-foreground text-center">
              No posts yet
            </Text>
          ) : (
            posts.map((p) => (
              <PostCard
                key={p.id}
                post={p}
                onDeleteError={(msg) => Alert.alert("Error", msg)}
                onInvalidate={() =>
                  queryClient.invalidateQueries(trpc.post.pathFilter())
                }
                trpc={trpc}
              />
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}

function PostCard({
  post,
  onDeleteError,
  onInvalidate,
  trpc,
}: {
  post: RouterOutputs["post"]["all"][number];
  onDeleteError: (msg: string) => void;
  onInvalidate: () => void;
  trpc: ReturnType<typeof useTRPC>;
}) {
  const queryClient = useQueryClient();
  const deletePost = useMutation(
    trpc.post.delete.mutationOptions({
      onSuccess: () => void onInvalidate(),
      onError: (err) =>
        onDeleteError(
          err.data?.code === "UNAUTHORIZED"
            ? "You must be logged in to delete"
            : "Failed to delete",
        ),
    }),
  );

  return (
    <View className="bg-muted rounded-lg p-4">
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-1">
          <Text className="text-foreground text-lg font-semibold">
            {post.title}
          </Text>
          <Text className="text-muted-foreground mt-1 text-sm">
            {post.content}
          </Text>
        </View>
        <Pressable
          onPress={() => deletePost.mutate(post.id)}
          disabled={deletePost.isPending}
          className="rounded px-2 py-1"
        >
          <Text className="text-sm font-medium text-red-600">Delete</Text>
        </Pressable>
      </View>
    </View>
  );
}
