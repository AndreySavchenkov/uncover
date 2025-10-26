"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/hooks/useUser";
import { usePhotoUpload } from "@/hooks/usePhotoUpload";
import z from "zod";
import { PhotoUploader } from "@/components/ui/photo-uploader";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Controller, useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MultiSelect } from "@/components/ui/multiselect";
import { CitySelect } from "@/components/ui/city-select";
import { GENDER_OPTIONS, Genders, LANGUAGE_OPTIONS } from "@/types";
const ABOUT_MAX = 500;

const formSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Min 3 symbols")
    .nonempty("Username is required"),
  age: z
    .string()
    .nonempty("Age is required")
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val), { message: "Age must be a number" })
    .refine((val) => val >= 18, { message: "You must be at least 18" })
    .refine((val) => val <= 100, { message: "Really? 😅" })
    .transform((val) => String(val)),
  about: z.string().trim().max(ABOUT_MAX, `Up to ${ABOUT_MAX} characters`),
  gender: z.nativeEnum(Genders),
  city_id: z.string().uuid().nullable().optional(),
  languages: z.array(z.string()).min(1, "Select at least one language"),
  looking_for: z.array(z.string()).min(1, "Select who you're looking for"),
});

export default function CreateProfilePage() {
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const { user, loading: userLoading } = useUser();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      age: "18",
      about: "",
      gender: undefined as unknown as Genders,
      city_id: null,
      languages: [],
      looking_for: [],
    },
  });

  async function onSubmit(formData: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);
      if (user) {
        const photoUrl = await uploadPhoto();

        const { error } = await supabase.from("profiles").upsert({
          id: user.id,
          username: formData.username,
          age: formData.age,
          photo_url: photoUrl,
          gender: formData.gender,
          city_id: formData.city_id ?? null,
          languages: formData.languages.join(","), // хранение как строка
          looking_for: formData.looking_for.join(","), // хранение как строка
          about: formData.about,
          email: user.email,
        });

        if (error) {
          toast.error(`${error.message}`, {
            position: "top-center",
          });
        }

        if (!error) {
          toast.success("Success!", {
            position: "top-center",
          });
          router.push("/");
        }
      }
    } catch (error) {
      toast.error(`Error: ${error}`, {
        position: "top-center",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const { setPhoto, photoPreview, uploadPhoto } = usePhotoUpload(user!);

  useEffect(() => {
    if (!user && !userLoading) router.push("/profile");
  }, [user, userLoading]);

  return (
    <div className="max-w-3xl mx-auto mt-10 mb-10 px-4 sm:px-6">
      <Card className="w-full sm:max-w-[unset]">
        <CardHeader>
          <CardTitle>Create your profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form id="form" onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-1">
                  <PhotoUploader
                    id="form-photo"
                    label="Profile photo"
                    hint="PNG/JPG up to 5MB"
                    previewUrl={photoPreview}
                    onSelectFile={setPhoto}
                  />
                </div>

                <div className="md:col-span-2 space-y-4">
                  <Controller
                    name="username"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="form-username">
                          Username
                        </FieldLabel>
                        <Input
                          {...field}
                          id="form-username"
                          placeholder="Enter your username"
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="age"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="form-age">Age</FieldLabel>
                        <Input
                          {...field}
                          type="number"
                          id="form-age"
                          placeholder="Enter your age"
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="gender"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Gender</FieldLabel>
                        <MultiSelect
                          multiple={false}
                          options={GENDER_OPTIONS}
                          value={(field.value as string) ?? null}
                          onChange={field.onChange}
                          placeholder="Your Gender"
                          enableSearch={false}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="about"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="form-about">About</FieldLabel>
                        <Textarea
                          {...field}
                          id="form-about"
                          placeholder="Tell about yourself"
                          className="min-h-28"
                          maxLength={ABOUT_MAX}
                          aria-describedby="about-counter"
                        />
                        <div
                          id="about-counter"
                          className="mt-1 text-xs text-muted-foreground text-right"
                        >
                          {field.value?.length ?? 0}/{ABOUT_MAX}
                        </div>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="city_id"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>City</FieldLabel>
                        <CitySelect
                          value={(field.value as string) ?? null}
                          onChange={field.onChange}
                          placeholder="Your city"
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="languages"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Languages</FieldLabel>
                        <MultiSelect
                          multiple
                          options={LANGUAGE_OPTIONS}
                          value={(field.value as string[]) ?? []}
                          onChange={field.onChange}
                          placeholder="Select languages"
                          searchThreshold={4}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="looking_for"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Looking for</FieldLabel>
                        <MultiSelect
                          multiple
                          options={GENDER_OPTIONS}
                          value={(field.value as string[]) ?? []}
                          onChange={field.onChange}
                          placeholder="Who are you looking for?"
                          enableSearch={false}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </div>
              </div>
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter>
          <Field orientation="horizontal">
            <Button type="submit" form="form" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create"}
            </Button>
          </Field>
        </CardFooter>
      </Card>
    </div>
  );
}
