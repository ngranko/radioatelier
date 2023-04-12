package hook

import (
    "context"

    "radioatelier/ent"
    "radioatelier/ent/user"
    "radioatelier/package/util"
)

//func SyncWithNotion(next ent.Mutator) ent.Mutator {
//return entHook.ObjectFunc(func(ctx context.Context, m *ent.ObjectMutation) (ent.Value, error) {
//    var obj *ent.Object
//    var err error
//
//    skipSync := false
//    id, ok := m.ID()
//    if !ok {
//        log.Printf("couldn't retrieve an object ID in a %s hook for notion sync", m.Op())
//    }
//
//    if isSyncMutation(m.Fields()) {
//        // if this is set we are actually doing a sync (either one or the other way), so without this check we'll end up with an infinite loop
//        skipSync = true
//    }
//
//    if !skipSync && isDeleteMutation(m.Op()) {
//        if ok == true {
//            obj, err = m.Client().Object.Query().Where(object.IDEQ(id)).First(ctx)
//            if err != nil {
//                log.Printf("couldn't retrieve an object with ID %s prior to %s for notion sync", id, m.Op())
//                skipSync = true
//            }
//        }
//    }
//
//    val, mErr := next.Mutate(ctx, m)
//    if mErr != nil {
//        return val, mErr
//    }
//
//    if !skipSync && !isDeleteMutation(m.Op()) {
//        obj, err = m.Client().Object.Query().Where(object.IDEQ(id)).First(ctx)
//        if err != nil {
//            log.Printf("couldn't retrieve an object with ID %s after %s for notion sync", id, m.Op())
//            skipSync = true
//        }
//    }
//
//    if !skipSync && isSyncable(ctx, obj) {
//        sync.ToNotion(obj)
//    }
//
//    return val, mErr
//})
//}

func isSyncable(ctx context.Context, obj *ent.Object) bool {
    count, err := obj.QueryUserInfo().Where(user.NotionIDNotNil()).Count(ctx)
    return err == nil && count > 0
}

func isSyncMutation(fields []string) bool {
    return util.Contains(fields, "last_sync")
}

func isDeleteMutation(operation ent.Op) bool {
    return operation == ent.OpDelete || operation == ent.OpDeleteOne
}
