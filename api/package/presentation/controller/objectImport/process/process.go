package process

import (
    "context"
    "fmt"
    "log/slog"
    "path/filepath"
    "strconv"
    "time"

    "github.com/google/uuid"

    "radioatelier/package/adapter/file"
    "radioatelier/package/config"
    "radioatelier/package/infrastructure/logger"
    "radioatelier/package/presentation/controller/objectImport/types"
    "radioatelier/package/usecase/file/document"
    "radioatelier/package/usecase/file/image"
    "radioatelier/package/usecase/presenter"
    "radioatelier/package/usecase/validation/validator"
)

func importObjects(ctx context.Context, ch chan message, ID string, separator rune, mappings types.ImportMappings) {
    user := ctx.Value("user").(presenter.User)

    f, err := file.Open("/tmp/" + ID)
    if err != nil {
        ch <- message{error: err}
        return
    }
    defer f.Delete()

    doc, err := document.CSVFromFile(f, separator)
    if err != nil {
        ch <- message{error: err}
        return
    }

    count := doc.GetLineCount()
    successfulLines := 0
    currentLine := 0
    messages := make([]types.LineFeedback, 0)

    for {
        select {
        case <-ctx.Done():
            logger.GetZerolog().Info("context cancelled, exiting without returning generation result", slog.String("user", user.GetModel().ID.String()))
            return
        default:
            if count > currentLine {
                ok, msgs := importNextLine(ctx, doc, mappings)
                if ok {
                    successfulLines++
                }
                for _, msg := range msgs {
                    msg.Text = fmt.Sprintf("Строка %d: %s", currentLine+1, msg.Text)
                    messages = append(messages, msg)
                }
                currentLine++
                ch <- message{percentage: currentLine * 100 / count}
            } else {
                ch <- message{result: &result{text: fmt.Sprintf("Импортировано %d точек из %d", successfulLines, count), feedback: messages}}
                return
            }
        }
    }
}

func importNextLine(ctx context.Context, csv *document.CSV, mappings types.ImportMappings) (bool, []types.LineFeedback) {
    user := ctx.Value("user").(presenter.User)
    messages := make([]types.LineFeedback, 0)

    line, err := csv.GetNextLine(mappings)
    if err != nil {
        messages = append(messages, types.LineFeedback{Text: "не удалось прочитать строку", Severity: "error"})
        return false, messages
    }

    mapPoint, feedback := importMapPoint(line)
    if feedback != nil {
        messages = append(messages, *feedback)
        return false, messages
    }

    category, feedback := importCategory(line)
    if feedback != nil {
        _ = mapPoint.Delete()
        messages = append(messages, *feedback)
        return false, messages
    }

    object, feedback := importObject(line, mapPoint, category, user)
    if feedback != nil {
        _ = mapPoint.Delete()
        messages = append(messages, *feedback)
        return false, messages
    }

    _, feedback = importObjectUser(line, object, user)
    if feedback != nil {
        messages = append(messages, *feedback)
    }

    messages = append(messages, importTags(line, object, user)...)
    messages = append(messages, importPrivateTags(line, object, user)...)

    return true, messages
}

func importMapPoint(line document.Line) (presenter.MapPoint, *types.LineFeedback) {
    location := types.Location{Latitude: line.GetLatitude(), Longitude: line.GetLongitude()}
    res := validator.Get().ValidateStruct(location)
    if !res.IsValid() {
        return nil, &types.LineFeedback{Text: "неверные координаты", Severity: "error"}
    }

    mapPoint := presenter.NewMapPoint()
    mapPointModel := mapPoint.GetModel()
    mapPointModel.Latitude = location.Latitude
    mapPointModel.Longitude = location.Longitude
    mapPointModel.Address = line.GetAddress()
    mapPointModel.City = line.GetCity()
    mapPointModel.Country = line.GetCountry()
    err := mapPoint.Create()
    if err != nil {
        return nil, &types.LineFeedback{Text: "не удалось создать маркер", Severity: "error"}
    }

    return mapPoint, nil
}

func importCategory(line document.Line) (presenter.Category, *types.LineFeedback) {
    category, err := presenter.GetCategoryByName(line.GetCategory())
    if err != nil {
        category = presenter.NewCategory()
        categoryModel := category.GetModel()
        categoryModel.Name = line.GetCategory()
        err = category.Create()
        if err != nil {
            return nil, &types.LineFeedback{Text: "не удалось создать категорию \"" + line.GetCategory() + "\"", Severity: "error"}
        }
    }

    return category, nil
}

func importObject(line document.Line, mapPoint presenter.MapPoint, category presenter.Category, user presenter.User) (presenter.Object, *types.LineFeedback) {
    img, err := processImage(line.GetImage())
    if err != nil {
        return nil, &types.LineFeedback{Text: "не удалось сохранить изображение", Severity: "error"}
    }

    source := line.GetSource()
    res := validator.Get().ValidateVar(source, "max=0|url")
    if !res.IsValid() {
        source = ""
    }

    object := presenter.NewObject()
    objectModel := object.GetModel()
    objectModel.MapPointID = mapPoint.GetModel().ID
    objectModel.Name = line.GetName()
    objectModel.Description = line.GetDescription()
    objectModel.InstalledPeriod = line.GetInstalledPeriod()
    objectModel.IsRemoved = line.GetIsRemoved()
    objectModel.RemovalPeriod = line.GetRemovalPeriod()
    objectModel.Source = source
    objectModel.Image = img
    objectModel.IsPublic = line.GetIsPublic()
    objectModel.CategoryID = category.GetModel().ID
    objectModel.CreatedBy = user.GetModel().ID
    objectModel.Creator = *user.GetModel()
    objectModel.UpdatedBy = user.GetModel().ID
    objectModel.Updater = *user.GetModel()
    err = object.Create()
    if err != nil {
        return nil, &types.LineFeedback{Text: "не удалось создать точку", Severity: "error"}
    }

    return object, nil
}

func importObjectUser(line document.Line, object presenter.Object, user presenter.User) (presenter.ObjectUser, *types.LineFeedback) {
    rating := line.GetRating()
    res := validator.Get().ValidateVar(rating, "max=0|oneof=1 2 3")
    if !res.IsValid() {
        rating = ""
    }

    objectUser := presenter.NewObjectUser()
    objectUserModel := objectUser.GetModel()
    objectUserModel.ObjectID = object.GetModel().ID
    objectUserModel.UserID = user.GetModel().ID
    objectUserModel.IsVisited = line.GetIsVisited()
    objectUserModel.Rating = rating
    err := objectUser.Create()
    if err != nil {
        return nil, &types.LineFeedback{Text: "не удалось создать приватные данные о точке", Severity: "warning"}
    }

    return objectUser, nil
}

func importTags(line document.Line, object presenter.Object, user presenter.User) []types.LineFeedback {
    messages := make([]types.LineFeedback, 0)

    tagIDs := make([]uuid.UUID, 0)
    for _, tag := range line.GetTags() {
        tagPresenter, err := presenter.GetTagByName(tag)
        if err != nil {
            tagPresenter = presenter.NewTag()
            tagModel := tagPresenter.GetModel()
            tagModel.Name = tag
            err = tagPresenter.Create()
            if err != nil {
                messages = append(messages, types.LineFeedback{Text: "не удалось создать тег \"" + tag + "\"", Severity: "warning"})
            }
        }
        tagIDs = append(tagIDs, tagPresenter.GetModel().ID)
    }

    err := object.SetTags(tagIDs)
    if err != nil {
        messages = append(messages, types.LineFeedback{Text: "не удалось привязать теги к точке", Severity: "warning"})
    }

    return messages
}

func importPrivateTags(line document.Line, object presenter.Object, user presenter.User) []types.LineFeedback {
    messages := make([]types.LineFeedback, 0)

    privateTagIDs := make([]uuid.UUID, 0)
    for _, privateTag := range line.GetPrivateTags() {
        privateTagPresenter, err := presenter.GetPrivateTagByName(user, privateTag)
        if err != nil {
            privateTagPresenter = presenter.NewPrivateTag()
            privateTagModel := privateTagPresenter.GetModel()
            privateTagModel.Name = privateTag
            privateTagModel.CreatedBy = user.GetModel().ID
            err = privateTagPresenter.Create()
            if err != nil {
                messages = append(messages, types.LineFeedback{Text: "не удалось создать тег \"" + privateTag + "\"", Severity: "warning"})
            }
        }
        privateTagIDs = append(privateTagIDs, privateTagPresenter.GetModel().ID)
    }

    err := object.SetPrivateTags(privateTagIDs, user)
    if err != nil {
        messages = append(messages, types.LineFeedback{Text: "не удалось привязать теги к точке", Severity: "warning"})
    }

    return messages
}

func processImage(source string) (string, error) {
    filename := ""
    var imageMutator *image.Image

    res := validator.Get().ValidateVar(source, "url")
    if res.IsValid() {
        img, err := image.NewImageFromURL(source)
        if err != nil {
            return "", err
        }

        filename = filepath.Base(source)
        imageMutator = img
    }

    res = validator.Get().ValidateVar(source, "base64")
    if res.IsValid() {
        img, err := image.NewImageFromBase64(source)
        if err != nil {
            return "", err
        }

        imageMutator = img
        filename = "image_" + strconv.FormatInt(time.Now().Unix(), 10) + "." + img.GetFormat()
    }

    if filename != "" {
        imageMutator.ResizeToFit(config.Get().ImageResolutionLimit)
        f, err := imageMutator.Save(config.Get().UploadDir + "/" + filename)
        if err != nil {
            return "", err
        }
        err = f.Close()
        if err != nil {
            return "", err
        }

        return "/uploads" + "/" + filename, nil
    }

    return "", nil
}
